import { useEffect, useRef, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { ColorPreset, ManagedType, UserConfig } from '../types';
import { configService } from '../services/configService';
import { useShowError } from '../components/ui/Toast';

const SAVE_DELAY_MS = 600;

/**
 * The user's types and presets. Edits are applied locally right away and saved
 * to Firestore after a short pause (or on flush), instead of on every keystroke.
 */
export function useUserConfig(user: FirebaseUser | null, isReady: boolean) {
  const [config, setConfig] = useState<UserConfig | null>(null);
  const showError = useShowError();
  // Latest local version, including edits that are not saved yet.
  const configRef = useRef<UserConfig | null>(null);
  const uidRef = useRef<string | null>(null);
  const hasPendingChanges = useRef(false);
  const saveTimer = useRef<number | undefined>(undefined);

  const applyLocally = (next: UserConfig | null) => {
    configRef.current = next;
    setConfig(next);
  };

  /** Saves pending edits; resolves to whether that worked (true when there was nothing to save). */
  const flush = async (what = 'Instellingen bewaren'): Promise<boolean> => {
    window.clearTimeout(saveTimer.current);
    const next = configRef.current;
    if (!hasPendingChanges.current || !next) return true;
    hasPendingChanges.current = false;
    try {
      await configService.saveConfig(uidRef.current!, next);
      return true;
    } catch (error) {
      // Keep the edit, so the next change or leaving the settings tries again
      hasPendingChanges.current = true;
      showError(what, error);
      return false;
    }
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
    const onPageHide = () => { flush(); };
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, []);

  const saveTypes = (mapTypes: (types: ManagedType[]) => ManagedType[], immediate = false, what?: string) => {
    const current = configRef.current;
    if (!current) return Promise.resolve(false);
    applyLocally({ ...current, types: mapTypes(current.types) });
    hasPendingChanges.current = true;

    window.clearTimeout(saveTimer.current);
    if (immediate) return flush(what);
    saveTimer.current = window.setTimeout(() => { flush(); }, SAVE_DELAY_MS);
    return Promise.resolve(true);
  };

  const mapPresets = (typeId: string, mapFn: (presets: ColorPreset[]) => ColorPreset[]) =>
    saveTypes(types => types.map(t => t.id === typeId ? { ...t, presets: mapFn(t.presets) } : t));

  const actions = {
    /** Adds an empty type and returns its id, so it can be opened right away. */
    addType: () => {
      const id = crypto.randomUUID();
      saveTypes(types => [...types, { id, name: 'Nieuw type', brand: 'Bambu Lab', presets: [] }], true, 'Type toevoegen');
      return id;
    },

    updateType: (id: string, updates: Partial<ManagedType>) =>
      saveTypes(types => types.map(t => t.id === id ? { ...t, ...updates } : t)),

    deleteType: (id: string) =>
      saveTypes(types => types.filter(t => t.id !== id), true, 'Type verwijderen'),

    addPreset: (typeId: string) =>
      mapPresets(typeId, presets => [...presets, { id: crypto.randomUUID(), name: 'Kleur', hex: '#666666' }]),

    removePreset: (typeId: string, presetId: string) =>
      mapPresets(typeId, presets => presets.filter(p => p.id !== presetId)),

    updatePreset: (typeId: string, presetId: string, updates: Partial<ColorPreset>) =>
      mapPresets(typeId, presets => presets.map(p => p.id === presetId ? { ...p, ...updates } : p)),

    /** Saves pending edits right away, e.g. when leaving the settings. */
    flush: () => flush(),
  };

  return { config, actions };
}

export type ConfigActions = ReturnType<typeof useUserConfig>['actions'];
