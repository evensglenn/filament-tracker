import { useEffect, useRef, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { ColorPreset, ManagedType, UserConfig } from '../types';
import { configService, mergeBambuDefaults } from '../services/configService';

const SAVE_DELAY_MS = 600;

/**
 * The user's types and presets. Edits are applied locally right away and saved
 * to Firestore after a short pause (or on flush), instead of on every keystroke.
 */
export function useUserConfig(user: FirebaseUser | null, isReady: boolean) {
  const [config, setConfig] = useState<UserConfig | null>(null);
  // Latest local version, including edits that are not saved yet.
  const configRef = useRef<UserConfig | null>(null);
  const uidRef = useRef<string | null>(null);
  const hasPendingChanges = useRef(false);
  const saveTimer = useRef<number | undefined>(undefined);

  const applyLocally = (next: UserConfig | null) => {
    configRef.current = next;
    setConfig(next);
  };

  const flush = () => {
    window.clearTimeout(saveTimer.current);
    const next = configRef.current;
    if (!hasPendingChanges.current || !next) return;
    hasPendingChanges.current = false;
    configService.saveConfig(uidRef.current!, next);
  };

  useEffect(() => {
    if (!isReady || !user) {
      hasPendingChanges.current = false;
      applyLocally(null);
      return;
    }

    uidRef.current = user.uid;
    const unsubscribeConfig = configService.subscribeToConfig(user.uid, (data) => {
      // Don't let a server update overwrite what the user is still typing.
      if (!hasPendingChanges.current) applyLocally(data);
    });

    return () => {
      flush();
      unsubscribeConfig();
    };
  }, [isReady, user]);

  // Save pending edits when the tab is closed or hidden.
  useEffect(() => {
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);

  const saveTypes = (mapTypes: (types: ManagedType[]) => ManagedType[], immediate = false) => {
    const current = configRef.current;
    if (!current) return;
    applyLocally({ ...current, types: mapTypes(current.types) });
    hasPendingChanges.current = true;

    window.clearTimeout(saveTimer.current);
    if (immediate) {
      flush();
    } else {
      saveTimer.current = window.setTimeout(flush, SAVE_DELAY_MS);
    }
  };

  const mapPresets = (typeId: string, mapFn: (presets: ColorPreset[]) => ColorPreset[]) =>
    saveTypes(types => types.map(t => t.id === typeId ? { ...t, presets: mapFn(t.presets) } : t));

  const actions = {
    addType: () => saveTypes(types => [...types, {
      id: crypto.randomUUID(),
      name: 'Nieuw type',
      brand: 'Bambu Lab',
      presets: []
    }], true),

    updateType: (id: string, updates: Partial<ManagedType>) =>
      saveTypes(types => types.map(t => t.id === id ? { ...t, ...updates } : t)),

    deleteType: (id: string) =>
      saveTypes(types => types.filter(t => t.id !== id), true),

    addPreset: (typeId: string) =>
      mapPresets(typeId, presets => [...presets, { id: crypto.randomUUID(), name: 'Kleur', hex: '#666666' }]),

    removePreset: (typeId: string, presetId: string) =>
      mapPresets(typeId, presets => presets.filter(p => p.id !== presetId)),

    updatePreset: (typeId: string, presetId: string, updates: Partial<ColorPreset>) =>
      mapPresets(typeId, presets => presets.map(p => p.id === presetId ? { ...p, ...updates } : p)),

    importBambuDefaults: () => saveTypes(mergeBambuDefaults, true),

    /** Saves pending edits right away, e.g. when the settings are closed. */
    flush,
  };

  return { config, actions };
}

export type ConfigActions = ReturnType<typeof useUserConfig>['actions'];
