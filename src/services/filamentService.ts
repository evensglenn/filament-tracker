import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDocFromServer,
  getDocs,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Filament, FilamentFormData } from '../types';

const COLLECTION_NAME = 'filaments';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recomputes the quantity of several filaments in one transaction, so the change is
 * all-or-nothing and based on the latest server values (not a possibly stale local copy).
 */
async function updateQuantities(
  amounts: Record<string, number>,
  computeQuantity: (filament: Filament, amount: number) => number
): Promise<void> {
  if (!auth.currentUser) throw new Error('User not authenticated');

  const entries = Object.entries(amounts).filter(([_, amount]) => amount > 0);
  if (entries.length === 0) return;

  try {
    await runTransaction(db, async (transaction) => {
      const refs = entries.map(([id]) => doc(db, COLLECTION_NAME, id));
      const snapshots = await Promise.all(refs.map(ref => transaction.get(ref)));
      const now = new Date().toISOString();

      snapshots.forEach((snapshot, i) => {
        if (!snapshot.exists()) return;
        transaction.update(refs[i], {
          quantity: computeQuantity(snapshot.data() as Filament, entries[i][1]),
          lastUsed: now
        });
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, COLLECTION_NAME);
  }
}

export const filamentService = {
  subscribeToFilaments: (callback: (filaments: Filament[]) => void, onError?: (error: any) => void) => {
    if (!auth.currentUser) return () => {};

    const filamentsQuery = query(
      collection(db, COLLECTION_NAME),
      where('uid', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(filamentsQuery, (snapshot) => {
      const filaments: Filament[] = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Filament));
      callback(filaments);
    }, (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    });
  },

  addFilament: async (formData: FilamentFormData): Promise<string> => {
    if (!auth.currentUser) throw new Error('User not authenticated');

    const newFilament = {
      ...formData,
      uid: auth.currentUser.uid,
      lastUsed: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), newFilament);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
      return '';
    }
  },

  updateFilament: async (id: string, formData: Partial<FilamentFormData>): Promise<void> => {
    if (!auth.currentUser) throw new Error('User not authenticated');

    const docRef = doc(db, COLLECTION_NAME, id);
    try {
      await updateDoc(docRef, {
        ...formData,
        lastUsed: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    }
  },

  /** Adds whole spools per filament id (a delivery). */
  addSpools: (spoolsById: Record<string, number>) =>
    updateQuantities(spoolsById, (filament, spools) =>
      Number((filament.quantity + spools).toFixed(2))
    ),

  /** Subtracts grams used per filament id (a print), never going below zero. */
  consumeGrams: (gramsById: Record<string, number>) =>
    updateQuantities(gramsById, (filament, grams) => {
      const spoolUsage = grams / (filament.spoolWeight || 1000);
      return Number(Math.max(0, filament.quantity - spoolUsage).toFixed(3));
    }),

  /** Moves all of the current user's filaments from one type name to another. */
  renameType: async (oldName: string, newName: string): Promise<void> => {
    if (!auth.currentUser) throw new Error('User not authenticated');

    try {
      const snapshot = await getDocs(query(
        collection(db, COLLECTION_NAME),
        where('uid', '==', auth.currentUser.uid),
        where('type', '==', oldName)
      ));
      if (snapshot.empty) return;

      const batch = writeBatch(db);
      snapshot.docs.forEach(d => batch.update(d.ref, { type: newName }));
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, COLLECTION_NAME);
    }
  },

  deleteFilament: async (id: string): Promise<void> => {
    if (!auth.currentUser) throw new Error('User not authenticated');

    const docRef = doc(db, COLLECTION_NAME, id);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }
  },

  testConnection: async () => {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if(error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration.");
      }
    }
  }
};
