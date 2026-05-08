import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserConfig, ManagedType } from '../types';
import { BAMBU_COLORS } from '../constants';

const CONFIG_COLLECTION = 'userConfigs';

export const DEFAULT_BAMBU_TYPES: ManagedType[] = Object.entries(BAMBU_COLORS).map(([name, presets]) => ({
  id: name.toLowerCase().replace(/\s+/g, '-'),
  name,
  brand: 'Bambu Lab',
  presets
}));

export const configService = {
  async getConfig(uid: string): Promise<UserConfig | null> {
    const docRef = doc(db, CONFIG_COLLECTION, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserConfig;
    }
    return null;
  },

  async saveConfig(config: UserConfig): Promise<void> {
    const docRef = doc(db, CONFIG_COLLECTION, config.uid);
    await setDoc(docRef, config);
  },

  subscribeToConfig(uid: string, callback: (config: UserConfig) => void) {
    const docRef = doc(db, CONFIG_COLLECTION, uid);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as UserConfig);
      } else {
        // Initialize with defaults if it doesn't exist
        const initialConfig: UserConfig = {
          uid,
          types: DEFAULT_BAMBU_TYPES
        };
        this.saveConfig(initialConfig);
        callback(initialConfig);
      }
    });
  },

  async importBambuDefaults(uid: string, currentConfig: UserConfig): Promise<void> {
    const updatedTypes = [...currentConfig.types];
    
    DEFAULT_BAMBU_TYPES.forEach(defaultType => {
      const existingIndex = updatedTypes.findIndex(t => t.name === defaultType.name && t.brand === defaultType.brand);
      if (existingIndex > -1) {
        updatedTypes[existingIndex] = { ...defaultType };
      } else {
        updatedTypes.push(defaultType);
      }
    });

    await this.saveConfig({
      ...currentConfig,
      types: updatedTypes
    });
  }
};
