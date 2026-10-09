import { getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { paths } from '../firebase';
import { UserConfig, ManagedType } from '../types';
import { BAMBU_COLORS } from '../constants';
import { handleFirestoreError, OperationType, requireConnection } from './filamentService';

export const DEFAULT_BAMBU_TYPES: ManagedType[] = Object.entries(BAMBU_COLORS).map(([name, presets]) => {
  const id = name.toLowerCase().replace(/\s+/g, '-');
  return {
    id,
    name,
    brand: 'Bambu Lab',
    presets: presets.map((preset, i) => ({ ...preset, id: `${id}-${i}` }))
  };
});

export const configService = {
  /** Creates the user document with the default types on first login. */
  async ensureAccount(uid: string): Promise<void> {
    try {
      const snap = await getDoc(paths.user(uid));
      if (!snap.exists()) {
        await setDoc(paths.user(uid), { types: DEFAULT_BAMBU_TYPES });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    }
  },

  async saveConfig(uid: string, config: UserConfig): Promise<void> {
    requireConnection();
    try {
      // merge keeps the other fields of the user document
      await setDoc(paths.user(uid), { types: config.types }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    }
  },

  subscribeToConfig(uid: string, callback: (config: UserConfig) => void) {
    return onSnapshot(paths.user(uid), (docSnap) => {
      // The document is created by ensureAccount before anything subscribes
      if (docSnap.exists()) {
        callback({ types: docSnap.data().types ?? [] });
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${uid}`));
  },
};
