/**
 * Integration tests against the Firebase emulators: the v1 → v2 migration, the quantity
 * transactions and the security rules. Run with `npm run test:emulator`.
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, getDocs, setDoc, Timestamp, updateDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { auth, db, paths } from '../firebase';
import { ensureMigrated } from './migrationService';
import { filamentService } from './filamentService';
import { configService } from './configService';
import { FilamentDoc } from '../types';

const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';
const DB_URL = `http://127.0.0.1:8080/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents`;
const DENIED = { code: 'permission-denied' };
const ADMIN = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }; // bypasses rules in the emulator

/** Writes a document with admin rights, e.g. to seed v1 data the rules no longer allow writing. */
async function adminSet(path: string, fields: Record<string, unknown>) {
  const toValue = (v: unknown): object =>
    typeof v === 'string' ? { stringValue: v }
    : typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v })
    : Array.isArray(v) ? { arrayValue: { values: v.map(toValue) } }
    : { mapValue: { fields: Object.fromEntries(Object.entries(v as object).map(([k, x]) => [k, toValue(x)])) } };
  const body = { fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, toValue(v)])) };
  const res = await fetch(`${DB_URL}/${path}`, { method: 'PATCH', headers: ADMIN, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`adminSet ${path}: ${res.status} ${await res.text()}`);
}

async function adminDeleteField(path: string, field: string) {
  const res = await fetch(`${DB_URL}/${path}?updateMask.fieldPaths=${field}`, { method: 'PATCH', headers: ADMIN, body: '{"fields":{}}' });
  if (!res.ok) throw new Error(`adminDeleteField ${path}: ${res.status}`);
}

async function signInAs(email: string) {
  await signOut(auth);
  try {
    return (await createUserWithEmailAndPassword(auth, email, 'password')).user.uid;
  } catch {
    return (await signInWithEmailAndPassword(auth, email, 'password')).user.uid;
  }
}

const filamentsOf = async (uid: string) => {
  const snap = await getDocs(paths.filaments(uid));
  return new Map(snap.docs.map(d => [d.id, d.data() as Omit<FilamentDoc, 'id'>]));
};

async function seedLegacy(uid: string) {
  await adminSet(`userConfigs/${uid}`, {
    uid,
    types: [{ id: 'pla-basic', name: 'PLA Basic', brand: 'Bambu Lab', presets: [{ name: 'Zwart', hex: '#1A1A1A' }, { name: 'Wit', hex: '#FFFFFF' }] }],
  });
  await adminSet('filaments/f1', {
    uid, brand: 'Bambu Lab', type: 'PLA Basic', colorName: 'Zwart', colorHex: '#1A1A1A',
    quantity: 1.5, spoolWeight: 1000, notes: 'Op de AMS', createdAt: '2025-03-01T10:00:00.000Z', lastUsed: '2025-04-01T10:00:00.000Z',
  });
  await adminSet('filaments/f2', {
    uid, brand: 'Sunlu', type: 'PETG Custom', colorName: 'Blauw', colorHex: '#0000FF', quantity: 0.873, spoolWeight: 250,
  });
  await adminSet('filaments/other', {
    uid: 'someone-else', brand: 'X', type: 'PLA Basic', colorName: 'Rood', colorHex: '#FF0000', quantity: 1, spoolWeight: 1000,
  });
}

describe.skipIf(!useEmulators)('Firestore v2 (emulator)', () => {
  let uid: string;

  beforeEach(async () => {
    await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents`, { method: 'DELETE' });
    uid = await signInAs('glenn@example.com');
  });

  afterAll(() => signOut(auth));

  describe('migration', () => {
    it('copies v1 data to users/{uid} with grams, type ids and preset ids', async () => {
      await seedLegacy(uid);
      await ensureMigrated(uid);

      const user = (await getDoc(paths.user(uid))).data()!;
      expect(user.migratedAt).toBeInstanceOf(Timestamp);
      expect(user.types.map((t: { id: string }) => t.id)).toEqual(['pla-basic', 'legacy-petg-custom']);
      expect(user.types[0].presets).toEqual([
        { id: 'pla-basic-0', name: 'Zwart', hex: '#1A1A1A' },
        { id: 'pla-basic-1', name: 'Wit', hex: '#FFFFFF' },
      ]);
      expect(user.types[1]).toMatchObject({ name: 'PETG Custom', brand: 'Sunlu', presets: [] });

      const filaments = await filamentsOf(uid);
      expect([...filaments.keys()].sort()).toEqual(['f1', 'f2']); // not the other user's filament
      expect(filaments.get('f1')).toMatchObject({ typeId: 'pla-basic', remainingGrams: 1500, spoolWeight: 1000, notes: 'Op de AMS' });
      expect(filaments.get('f1')!.createdAt.toDate().toISOString()).toBe('2025-03-01T10:00:00.000Z');
      expect(filaments.get('f1')!.lastUsedAt).toBeUndefined();
      expect(filaments.get('f2')).toMatchObject({ typeId: 'legacy-petg-custom', remainingGrams: 218, notes: '' });
    });

    it('starts a new account with the Bambu Lab defaults', async () => {
      await ensureMigrated(uid);
      const user = (await getDoc(paths.user(uid))).data()!;
      expect(user.types.length).toBeGreaterThan(0);
      expect(user.types[0].presets[0].id).toBe(`${user.types[0].id}-0`);
      expect((await filamentsOf(uid)).size).toBe(0);
    });

    it('runs only once', async () => {
      await seedLegacy(uid);
      await ensureMigrated(uid);
      await filamentService.updateFilament('f1', { remainingGrams: 42 });
      await ensureMigrated(uid);
      expect((await filamentsOf(uid)).get('f1')!.remainingGrams).toBe(42);
    });

    it('resumes an interrupted run without overwriting migrated filaments', async () => {
      await seedLegacy(uid);
      await ensureMigrated(uid);
      await filamentService.updateFilament('f1', { remainingGrams: 42 });
      await adminDeleteField(`users/${uid}`, 'migratedAt'); // as if the final batch never happened

      await ensureMigrated(uid);
      const filaments = await filamentsOf(uid);
      expect(filaments.get('f1')!.remainingGrams).toBe(42);
      expect(filaments.size).toBe(2);
      expect((await getDoc(paths.user(uid))).data()!.migratedAt).toBeInstanceOf(Timestamp);
    });

    it('gives the same result when two devices migrate at the same time', async () => {
      await seedLegacy(uid);
      await Promise.all([ensureMigrated(uid), ensureMigrated(uid)]);
      const filaments = await filamentsOf(uid);
      expect(filaments.size).toBe(2);
      expect(filaments.get('f1')!.remainingGrams).toBe(1500);
    });
  });

  describe('quantities and print log', () => {
    let id: string;

    beforeEach(async () => {
      await ensureMigrated(uid);
      id = await filamentService.addFilament({
        typeId: 'pla-basic', brand: 'Bambu Lab', colorName: 'Zwart', colorHex: '#1A1A1A', remainingGrams: 1000, spoolWeight: 1000, notes: '',
      });
    });

    it('adds whole spools on a delivery', async () => {
      await filamentService.addSpools({ [id]: 2 });
      expect((await filamentsOf(uid)).get(id)!.remainingGrams).toBe(3000);
    });

    it('subtracts a print, never below zero, and logs it', async () => {
      await filamentService.logPrint({ [id]: 250.4 });
      let filament = (await filamentsOf(uid)).get(id)!;
      expect(filament.remainingGrams).toBe(750);
      expect(filament.lastUsedAt).toBeInstanceOf(Timestamp);

      await filamentService.logPrint({ [id]: 5000 });
      filament = (await filamentsOf(uid)).get(id)!;
      expect(filament.remainingGrams).toBe(0);

      const prints = (await getDocs(paths.prints(uid))).docs.map(d => d.data());
      expect(prints).toHaveLength(2);
      expect(prints.flatMap(p => p.items.map((i: { grams: number }) => i.grams)).sort()).toEqual([250, 5000]);
      expect(prints[0].items[0]).toMatchObject({ filamentId: id, typeId: 'pla-basic', colorName: 'Zwart' });
    });

    it('loses no usage when two prints are registered at the same time', async () => {
      await Promise.all([
        filamentService.logPrint({ [id]: 100 }),
        filamentService.logPrint({ [id]: 200 }),
        filamentService.addSpools({ [id]: 1 }),
      ]);
      expect((await filamentsOf(uid)).get(id)!.remainingGrams).toBe(1700);
    });

    it('ignores empty and zero amounts', async () => {
      await filamentService.logPrint({ [id]: 0 });
      await filamentService.addSpools({});
      expect((await getDocs(paths.prints(uid))).size).toBe(0);
    });
  });

  describe('settings', () => {
    it('keeps the migration marker when saving types', async () => {
      await ensureMigrated(uid);
      await configService.saveConfig(uid, { types: [] });
      const user = (await getDoc(paths.user(uid))).data()!;
      expect(user.types).toEqual([]);
      expect(user.migratedAt).toBeInstanceOf(Timestamp);
    });
  });

  describe('security rules', () => {
    const validFilament = () => ({
      typeId: 't', brand: 'B', colorName: 'C', colorHex: '#000000', remainingGrams: 10, spoolWeight: 1000, notes: '',
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });

    it('keeps users out of each other\'s data', async () => {
      await ensureMigrated(uid);
      const id = await filamentService.addFilament({ ...validFilament(), remainingGrams: 10 } as never);
      await signInAs('stranger@example.com');
      await expect(getDoc(paths.user(uid))).rejects.toMatchObject(DENIED);
      await expect(getDocs(paths.filaments(uid))).rejects.toMatchObject(DENIED);
      await expect(setDoc(paths.filament(uid, id), validFilament())).rejects.toMatchObject(DENIED);
    });

    it('makes the v1 collections read-only', async () => {
      await seedLegacy(uid);
      await expect(getDoc(doc(db, 'filaments', 'f1'))).resolves.toBeTruthy();
      await expect(updateDoc(doc(db, 'filaments', 'f1'), { quantity: 9 })).rejects.toMatchObject(DENIED);
      await expect(setDoc(doc(db, 'userConfigs', uid), { uid, types: [] })).rejects.toMatchObject(DENIED);
    });

    it('rejects invalid filaments', async () => {
      const ref = paths.filament(uid, 'x');
      await expect(setDoc(ref, { ...validFilament(), remainingGrams: 1.5 })).rejects.toMatchObject(DENIED);
      await expect(setDoc(ref, { ...validFilament(), colorHex: 'red' })).rejects.toMatchObject(DENIED);
      await expect(setDoc(ref, { ...validFilament(), extra: true })).rejects.toMatchObject(DENIED);
      await expect(setDoc(ref, validFilament())).resolves.toBeUndefined();
    });

    it('keeps createdAt fixed and the print log append-only', async () => {
      const ref = paths.filament(uid, 'x');
      await setDoc(ref, validFilament());
      await expect(updateDoc(ref, { createdAt: Timestamp.fromDate(new Date('2020-01-01')), updatedAt: serverTimestamp() })).rejects.toMatchObject(DENIED);

      await filamentService.logPrint({ x: 5 });
      const [print] = (await getDocs(paths.prints(uid))).docs;
      await expect(updateDoc(print.ref, { items: [] })).rejects.toMatchObject(DENIED);
    });
  });
});
