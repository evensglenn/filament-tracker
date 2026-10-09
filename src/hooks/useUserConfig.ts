import { useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { ColorPreset, ManagedType, UserConfig } from '../types';
import { configService } from '../services/configService';

export function useUserConfig(user: FirebaseUser | null, isAuthReady: boolean) {
  const [config, setConfig] = useState<UserConfig | null>(null);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setConfig(null);
      return;
    }

    const unsubscribeConfig = configService.subscribeToConfig(user.uid, (data) => {
      setConfig(data);
    });

    return () => unsubscribeConfig();
  }, [isAuthReady, user]);

  const saveTypes = (mapTypes: (types: ManagedType[]) => ManagedType[]) => {
    if (!config) return;
    configService.saveConfig({ ...config, types: mapTypes(config.types) });
  };

  const mapPresets = (typeId: string, mapFn: (presets: ColorPreset[]) => ColorPreset[]) =>
    saveTypes(types => types.map(t => t.id === typeId ? { ...t, presets: mapFn(t.presets) } : t));

  const actions = {
    addType: () => saveTypes(types => [...types, {
      id: crypto.randomUUID(),
      name: 'Nieuw type',
      brand: 'Bambu Lab',
      presets: []
    }]),

    updateType: (id: string, updates: Partial<ManagedType>) =>
      saveTypes(types => types.map(t => t.id === id ? { ...t, ...updates } : t)),

    deleteType: (id: string) =>
      saveTypes(types => types.filter(t => t.id !== id)),

    addPreset: (typeId: string) =>
      mapPresets(typeId, presets => [...presets, { name: 'Kleur', hex: '#666666' }]),

    removePreset: (typeId: string, presetIndex: number) =>
      mapPresets(typeId, presets => presets.filter((_, i) => i !== presetIndex)),

    updatePreset: (typeId: string, presetIndex: number, updates: Partial<ColorPreset>) =>
      mapPresets(typeId, presets => presets.map((p, i) => i === presetIndex ? { ...p, ...updates } : p)),

    importBambuDefaults: () => {
      if (!config) return;
      configService.importBambuDefaults(config.uid, config);
    },
  };

  return { config, actions };
}

export type ConfigActions = ReturnType<typeof useUserConfig>['actions'];
