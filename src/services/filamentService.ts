import {
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Transaction,
  updateDoc
} from 'firebase/firestore';
import { db, auth, paths } from '../firebase';
import { FilamentDoc, FilamentInput, PrintItem } from '../types';
import { codedError } from '../utils/errors';

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
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
  // Keep the Firebase error code (e.g. 'permission-denied'), so the UI can explain what went wrong
  const code = typeof error === 'object' && error !== null && 'code' in error ? (error as { code: unknown }).code : undefined;
  throw Object.assign(new Error(JSON.stringify(errInfo)), { code });
}

/**
 * Fails right away without a connection. Firestore would otherwise keep the write waiting
 * until the connection is back, with no sign that nothing was saved yet.
 */
export function requireConnection() {
  if (!navigator.onLine) throw codedError('unavailable', 'No connection');
}

export function currentUid(): string {
  if (!auth.currentUser) throw new Error('User not authenticated');
  return auth.currentUser.uid;
}

/** Keeps the entries with a positive amount, rounded to whole numbers. */
const positiveAmounts = (amounts: Record<string, number>, round: (n: number) => number = n => n) =>
  new Map(Object.entries(amounts).filter(([_, amount]) => amount > 0).map(([id, amount]) => [id, round(amount)]));

/** Reads the given filaments inside a transaction, skipping ids that no longer exist. */
async function readFilaments(transaction: Transaction, uid: string, ids: string[]) {
  const snapshots = await Promise.all(ids.map(id => transaction.get(paths.filament(uid, id))));
  return snapshots
    .filter(snapshot => snapshot.exists())
    .map(snapshot => ({ ref: snapshot.ref, data: snapshot.data() as Omit<FilamentDoc, 'id'> }));
}

export const filamentService = {
  subscribeToFilaments: (callback: (filaments: FilamentDoc[]) => void, onError?: (error: any) => void) => {
    const uid = currentUid();
    return onSnapshot(paths.filaments(uid), (snapshot) => {
      const filaments = snapshot.docs.map(d => ({
        // Pending server timestamps get a local estimate instead of null
        ...d.data({ serverTimestamps: 'estimate' }),
        id: d.id
      } as FilamentDoc));
      callback(filaments);
    }, (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, `users/${uid}/filaments`);
    });
  },

  addFilament: async (input: FilamentInput): Promise<string> => {
    requireConnection();
    const uid = currentUid();
    try {
      const docRef = await addDoc(paths.filaments(uid), {
        ...input,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${uid}/filaments`);
    }
  },

  updateFilament: async (id: string, input: Partial<FilamentInput>): Promise<void> => {
    requireConnection();
    const uid = currentUid();
    try {
      await updateDoc(paths.filament(uid, id), { ...input, updatedAt: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}/filaments/${id}`);
    }
  },

  deleteFilament: async (id: string): Promise<void> => {
    requireConnection();
    const uid = currentUid();
    try {
      await deleteDoc(paths.filament(uid, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}/filaments/${id}`);
    }
  },

  /**
   * Registers a delivery: adds whole spools per filament id. Runs as one transaction on the
   * latest server values, so it is all-or-nothing and safe when several devices are in use.
   */
  addSpools: async (spoolsById: Record<string, number>): Promise<void> => {
    requireConnection();
    const uid = currentUid();
    const spools = positiveAmounts(spoolsById);
    if (spools.size === 0) return;

    try {
      await runTransaction(db, async (transaction) => {
        const filaments = await readFilaments(transaction, uid, [...spools.keys()]);
        filaments.forEach(({ ref, data }) => {
          transaction.update(ref, {
            remainingGrams: data.remainingGrams + Math.round(spools.get(ref.id)! * data.spoolWeight),
            updatedAt: serverTimestamp()
          });
        });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}/filaments`);
    }
  },

  /**
   * Registers a print: subtracts the grams used per filament id (never below zero) and adds
   * an entry to the print log, all in one transaction.
   */
  logPrint: async (gramsById: Record<string, number>): Promise<void> => {
    requireConnection();
    const uid = currentUid();
    const usage = positiveAmounts(gramsById, Math.round);
    if (usage.size === 0) return;

    try {
      await runTransaction(db, async (transaction) => {
        const filaments = await readFilaments(transaction, uid, [...usage.keys()]);
        const items: PrintItem[] = filaments.map(({ ref, data }) => {
          const grams = usage.get(ref.id)!;
          transaction.update(ref, {
            remainingGrams: Math.max(0, data.remainingGrams - grams),
            updatedAt: serverTimestamp(),
            lastUsedAt: serverTimestamp()
          });
          return { filamentId: ref.id, typeId: data.typeId, colorName: data.colorName, colorHex: data.colorHex, grams };
        });

        if (items.length > 0) {
          transaction.set(doc(paths.prints(uid)), { createdAt: serverTimestamp(), items });
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}/prints`);
    }
  },
};
