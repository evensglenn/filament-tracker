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
  setDoc,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Filament, FilamentFormData } from '../types';

const COLLECTION_NAME = 'filaments';
const SHARES_COLLECTION = 'shares';

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

export const filamentService = {
  subscribeToFilaments: (callback: (filaments: Filament[]) => void, onError?: (error: any) => void) => {
    if (!auth.currentUser) return () => {};

    const currentUid = auth.currentUser.uid;
    const currentEmail = auth.currentUser.email;

    // First, find all UIDs that have shared their data with the current user
    const sharesQuery = query(
      collection(db, SHARES_COLLECTION),
      where('emails', 'array-contains', currentEmail)
    );

    let filamentUnsubscribe: (() => void) | null = null;

    const sharesUnsubscribe = onSnapshot(sharesQuery, (sharesSnapshot) => {
      const sharedUids = sharesSnapshot.docs.map(doc => doc.id);
      const allUids = [currentUid, ...sharedUids];

      if (filamentUnsubscribe) filamentUnsubscribe();

      const filamentsQuery = query(
        collection(db, COLLECTION_NAME),
        where('uid', 'in', allUids),
        orderBy('createdAt', 'desc')
      );

      filamentUnsubscribe = onSnapshot(filamentsQuery, (snapshot) => {
        const filaments: Filament[] = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        } as Filament));
        callback(filaments);
      }, (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      });
    }, (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, SHARES_COLLECTION);
    });

    return () => {
      sharesUnsubscribe();
      if (filamentUnsubscribe) filamentUnsubscribe();
    };
  },

  getShares: async (): Promise<string[]> => {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const docRef = doc(db, SHARES_COLLECTION, auth.currentUser.uid);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().emails || [];
      }
      return [];
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${SHARES_COLLECTION}/${auth.currentUser.uid}`);
      return [];
    }
  },

  updateShares: async (emails: string[]): Promise<void> => {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const docRef = doc(db, SHARES_COLLECTION, auth.currentUser.uid);
    try {
      await setDoc(docRef, { emails });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${SHARES_COLLECTION}/${auth.currentUser.uid}`);
    }
  },

  addFilament: async (formData: FilamentFormData): Promise<string> => {
    if (!auth.currentUser) throw new Error('User not authenticated');

    const newFilament = {
      ...formData,
      uid: auth.currentUser.uid,
      ownerName: auth.currentUser.displayName || auth.currentUser.email || 'Onbekend',
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
