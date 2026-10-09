#!/usr/bin/env node
// Fills the (empty) Firestore emulator with a test account and a realistic inventory,
// so `npm run dev:local` starts with something to look at. Never touches the real database.
import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(new URL('../firebase-applet-config.json', import.meta.url), 'utf8'));
const DOCS = `http://127.0.0.1:8080/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents`;
const ADMIN = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }; // bypasses the rules in the emulator

const ACCOUNT = { sub: 'test-account', email: 'test@example.com', name: 'Test', email_verified: true };

// [type id, color name, hex, grams left, notes, days since last print]
const FILAMENTS = [
  ['pla-basic', 'Jadewit (10100)', '#F5F5F5', 2300, 'AMS slot 1', 1],
  ['pla-basic', 'Zwart (10107)', '#1A1A1A', 3800, '', 3],
  ['pla-basic', 'Rood (10200)', '#D0112B', 873, '', null],
  ['pla-basic', 'Cyaan (10600)', '#00A0E9', 150, '', 10],
  ['pla-basic', 'Geel (10401)', '#FDB913', 1000, '', null],
  ['pla-matte', 'Asgrijs (11101)', '#B2BEB5', 640, '', null],
  ['pla-matte', 'Donkergroen (11501)', '#006400', 1000, '', null],
  ['petg-hf', 'Zwart (30101)', '#1A1A1A', 2000, 'Voor buitenonderdelen', null],
  ['petg-basic', 'Transparant (31105)', '#E0E0E0', 420, '', null],
  ['pla-galaxy', 'Galaxy Nebula (13300)', '#5142A5', 90, '', null],
  ['petg-translucent', 'Oranje (32401)', '#F47920', 1000, '', null],
];

// A Google account in the Auth emulator; it shows up in the emulator's sign-in popup
const account = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=emulator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    requestUri: 'http://localhost',
    returnSecureToken: true,
    postBody: `id_token=${encodeURIComponent(JSON.stringify(ACCOUNT))}&providerId=google.com`,
  }),
}).then(r => r.json());
if (!account.localId) throw new Error(`Testaccount aanmaken mislukt: ${JSON.stringify(account)}`);

const daysAgo = days => new Date(Date.now() - days * 86_400_000).toISOString();

for (const [i, [typeId, colorName, colorHex, grams, notes, lastUsed]] of FILAMENTS.entries()) {
  const fields = {
    typeId: { stringValue: typeId },
    brand: { stringValue: 'Bambu Lab' },
    colorName: { stringValue: colorName },
    colorHex: { stringValue: colorHex },
    remainingGrams: { integerValue: String(grams) },
    spoolWeight: { integerValue: '1000' },
    notes: { stringValue: notes },
    createdAt: { timestampValue: daysAgo(60 - i) },
    updatedAt: { timestampValue: daysAgo(lastUsed ?? 30) },
    ...(lastUsed !== null && { lastUsedAt: { timestampValue: daysAgo(lastUsed) } }),
  };
  const res = await fetch(`${DOCS}/users/${account.localId}/filaments/test-${i}`, {
    method: 'PATCH', headers: ADMIN, body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`Testdata laden mislukt: ${res.status} ${await res.text()}`);
}
// The user document with the default types is created by the app on first login

console.log(`\n  Testdata geladen: ${FILAMENTS.length} spoelen voor ${ACCOUNT.email}.`);
console.log(`  Open http://localhost:5180, klik op "Log in met Google" en kies "${ACCOUNT.name}" in het venster van de emulator.\n`);
