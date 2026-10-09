import { onSnapshot, setDoc } from 'firebase/firestore';
import { paths } from '../firebase';
import { UserConfig, ManagedType } from '../types';
import { BAMBU_COLORS } from '../constants';
import { handleFirestoreError, OperationType } from './filamentService';

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
  async saveConfig(uid: string, config: UserConfig): Promise<void> {
    try {
      // merge keeps the other fields of the user document (e.g. migratedAt)
      await setDoc(paths.user(uid), { types: config.types }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    }
  },

  subscribeToConfig(uid: string, callback: (config: UserConfig) => void) {
    return onSnapshot(paths.user(uid), (docSnap) => {
      // The document is created by the migration before anything subscribes
      if (docSnap.exists()) {
        callback({ types: docSnap.data().types ?? [] });
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${uid}`));
  },
};

/**
 * Adds the default Bambu Lab types. A type with the same name and brand gets the default
 * presets but keeps its id, so filaments that use it stay linked.
 */
export function mergeBambuDefaults(types: ManagedType[]): ManagedType[] {
  const updatedTypes = [...types];

  DEFAULT_BAMBU_TYPES.forEach(defaultType => {
    const existingIndex = updatedTypes.findIndex(t => t.name === defaultType.name && t.brand === defaultType.brand);
    if (existingIndex > -1) {
      updatedTypes[existingIndex] = { ...defaultType, id: updatedTypes[existingIndex].id };
    } else {
      updatedTypes.push(defaultType);
    }
  });

  return updatedTypes;
}
