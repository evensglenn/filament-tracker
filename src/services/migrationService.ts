import { collection, doc, getDoc, getDocs, query, serverTimestamp, Timestamp, where, writeBatch } from 'firebase/firestore';
import { db, paths } from '../firebase';
import { ManagedType } from '../types';
import { DEFAULT_BAMBU_TYPES } from './configService';

/** Shape of the documents before the move to users/{uid} (v1). */
interface LegacyFilament {
  uid: string;
  brand: string;
  type: string; // type name
  colorName: string;
  colorHex: string;
  quantity: number; // spools, may be fractional
  spoolWeight?: number;
  notes?: string;
  createdAt?: string; // ISO 8601
}

interface LegacyConfig {
  types: (Omit<ManagedType, 'presets'> & { presets: { name: string; hex: string }[] })[];
}

const BATCH_SIZE = 400; // Firestore allows 500 writes per batch

const slug = (text: string) => text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'type';

const toTimestamp = (iso?: string) => {
  const date = iso ? new Date(iso) : null;
  return date && !isNaN(date.getTime()) && date.getTime() <= Date.now() ? Timestamp.fromDate(date) : serverTimestamp();
};

/**
 * One-time move from the v1 layout (top-level `filaments` and `userConfigs`) to `users/{uid}`.
 *
 * Safe to run on several devices at once: every id is derived from the old data, so two runs
 * produce the same documents and never duplicates. The `migratedAt` marker is written last, so
 * an interrupted run is simply repeated on the next login. The old documents are left untouched.
 */
export async function ensureMigrated(uid: string, attempts = 3): Promise<void> {
  try {
    await migrate(uid);
  } catch (error) {
    // Another device may be migrating at the same moment; a new attempt skips what it already copied
    if (attempts <= 1) throw error;
    await new Promise(resolve => setTimeout(resolve, 500));
    await ensureMigrated(uid, attempts - 1);
  }
}

async function migrate(uid: string): Promise<void> {
  const userSnap = await getDoc(paths.user(uid));
  if (userSnap.exists() && userSnap.data().migratedAt) return;

  const [legacyConfigSnap, legacyFilamentsSnap, migratedSnap] = await Promise.all([
    getDoc(doc(db, 'userConfigs', uid)),
    getDocs(query(collection(db, 'filaments'), where('uid', '==', uid))),
    getDocs(paths.filaments(uid)),
  ]);
  // Filaments copied by an earlier, interrupted run (possibly already edited) are left alone
  const alreadyMigrated = new Set(migratedSnap.docs.map(d => d.id));

  // Types: keep the existing ones (giving presets an id), or start from the Bambu Lab defaults
  const legacyTypes = legacyConfigSnap.exists() ? (legacyConfigSnap.data() as LegacyConfig).types : null;
  const types: ManagedType[] = legacyTypes
    ? legacyTypes.map(t => ({ ...t, presets: (t.presets ?? []).map((p, i) => ({ id: `${t.id}-${i}`, name: p.name, hex: p.hex })) }))
    : [...DEFAULT_BAMBU_TYPES]; // copy: missing types get pushed below

  // Filaments referred to their type by name; link them by id, adding types that were missing
  const typeIdFor = (filament: LegacyFilament) => {
    let type = types.find(t => t.name === filament.type);
    if (!type) {
      type = { id: `legacy-${slug(filament.type)}`, name: filament.type, brand: filament.brand, presets: [] };
      types.push(type);
    }
    return type.id;
  };

  const writes = legacyFilamentsSnap.docs.map(d => {
    const legacy = d.data() as LegacyFilament;
    const spoolWeight = legacy.spoolWeight || 1000;
    return {
      ref: paths.filament(uid, d.id),
      data: {
        typeId: typeIdFor(legacy),
        brand: legacy.brand,
        colorName: legacy.colorName,
        colorHex: legacy.colorHex,
        remainingGrams: Math.max(0, Math.round(legacy.quantity * spoolWeight)),
        spoolWeight,
        notes: legacy.notes ?? '',
        createdAt: toTimestamp(legacy.createdAt),
        updatedAt: serverTimestamp(),
      },
    };
  });

  const newWrites = writes.filter(({ ref }) => !alreadyMigrated.has(ref.id));
  for (let i = 0; i < newWrites.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    newWrites.slice(i, i + BATCH_SIZE).forEach(({ ref, data }) => batch.set(ref, data));
    await batch.commit();
  }

  const finalBatch = writeBatch(db);
  finalBatch.set(paths.user(uid), { types, migratedAt: serverTimestamp() });
  await finalBatch.commit();
}
