import { useEffect, useRef, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { ColorPreset, ManagedType, UserConfig } from '../types';
import { configService, mergeBambuDefaults } from '../services/configService';
import { filamentService } from '../services/filamentService';

const SAVE_DELAY_MS = 600;

/** Type names whose id stayed the same but whose name changed between two versions. */
const findRenamedTypes = (before: ManagedType[], after: ManagedType[]) =>
  after.flatMap(type => {
    const previous = before.find(t => t.id === type.id);
    const newName = type.name.trim();
    return previous && newName && previous.name !== newName
      ? [{ oldName: previous.name, newName }]
      : [];
  });

/**
 * The user's types and presets. Edits are applied locally right away and saved
 * to Firestore after a short pause (or on flush), instead of on every keystroke.
 */
export function useUserConfig(user: FirebaseUser | null, isAuthReady: boolean) {
  const [config, setConfig] = useState<UserConfig | null>(null);
  // Latest local version, including edits that are not saved yet.
  const configRef = useRef<UserConfig | null>(null);
  // Last version known to be in Firestore, used to detect renamed types.
  const savedRef = useRef<UserConfig | null>(null);
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

    const renames = savedRef.current ? findRenamedTypes(savedRef.current.types, next.types) : [];
    savedRef.current = next;

    configService.saveConfig(next);
    renames.forEach(({ oldName, newName }) => filamentService.renameType(oldName, newName));
  };

  useEffect(() => {
    if (!isAuthReady || !user) {
      hasPendingChanges.current = false;
      savedRef.current = null;
      applyLocally(null);
      return;
    }

    const unsubscribeConfig = configService.subscribeToConfig(user.uid, (data) => {
      savedRef.current = data;
      // Don't let a server update overwrite what the user is still typing.
      if (!hasPendingChanges.current) applyLocally(data);
    });

    return () => {
      flush();
      unsubscribeConfig();
    };
  }, [isAuthReady, user]);

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
      mapPresets(typeId, presets => [...presets, { name: 'Kleur', hex: '#666666' }]),

    removePreset: (typeId: string, presetIndex: number) =>
      mapPresets(typeId, presets => presets.filter((_, i) => i !== presetIndex)),

    updatePreset: (typeId: string, presetIndex: number, updates: Partial<ColorPreset>) =>
      mapPresets(typeId, presets => presets.map((p, i) => i === presetIndex ? { ...p, ...updates } : p)),

    importBambuDefaults: () => saveTypes(mergeBambuDefaults, true),

    /** Saves pending edits right away, e.g. when the settings are closed. */
    flush,
  };

  return { config, actions };
}

export type ConfigActions = ReturnType<typeof useUserConfig>['actions'];
