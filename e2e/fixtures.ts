import { test as base, expect, Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(new URL('../firebase-applet-config.json', import.meta.url), 'utf8'));
const DOCS = `http://127.0.0.1:8080/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents`;
const ADMIN = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }; // bypasses the rules in the emulator

export interface SeedFilament {
  typeId: string;
  colorName: string;
  colorHex: string;
  grams: number;
  notes?: string;
}

/** A small inventory with every stock state: plenty, "Beperkt" (≤ 500 g) and "Bijna op" (≤ 250 g). */
export const INVENTORY: SeedFilament[] = [
  { typeId: 'pla-basic', colorName: 'Rood (10200)', colorHex: '#D0112B', grams: 873 },
  { typeId: 'pla-basic', colorName: 'Cyaan (10600)', colorHex: '#00A0E9', grams: 150 },
  { typeId: 'pla-basic', colorName: 'Geel (10401)', colorHex: '#FDB913', grams: 1000 },
  { typeId: 'pla-basic', colorName: 'Zwart (10107)', colorHex: '#1A1A1A', grams: 3800 },
  { typeId: 'pla-matte', colorName: 'Asgrijs (11101)', colorHex: '#B2BEB5', grams: 640 },
  { typeId: 'petg-basic', colorName: 'Transparant (31105)', colorHex: '#E0E0E0', grams: 420 },
];

/** A Google account in the Auth emulator; it shows up in the emulator's sign-in popup. */
async function createAccount(email: string) {
  const res = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=emulator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestUri: 'http://localhost',
      returnSecureToken: true,
      postBody: `id_token=${encodeURIComponent(JSON.stringify({ sub: email, email, name: email.split('@')[0], email_verified: true }))}&providerId=google.com`,
    }),
  });
  const account = await res.json();
  if (!account.localId) throw new Error(`Creating the test account failed: ${JSON.stringify(account)}`);
  return account.localId as string;
}

async function seed(uid: string, filaments: SeedFilament[]) {
  const now = new Date().toISOString();
  for (const [i, f] of filaments.entries()) {
    const fields = {
      typeId: { stringValue: f.typeId },
      brand: { stringValue: 'Bambu Lab' },
      colorName: { stringValue: f.colorName },
      colorHex: { stringValue: f.colorHex },
      remainingGrams: { integerValue: String(f.grams) },
      spoolWeight: { integerValue: '1000' },
      notes: { stringValue: f.notes ?? '' },
      createdAt: { timestampValue: now },
      updatedAt: { timestampValue: now },
    };
    const res = await fetch(`${DOCS}/users/${uid}/filaments/f${i}`, { method: 'PATCH', headers: ADMIN, body: JSON.stringify({ fields }) });
    if (!res.ok) throw new Error(`Seeding failed: ${res.status} ${await res.text()}`);
  }
}

async function signIn(page: Page, email: string) {
  await page.goto('/');
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('button', { name: 'Inloggen met Google' }).click(),
  ]);
  await popup.waitForLoadState();
  // The emulator popup needs a moment before a click on an account registers
  const choice = popup.getByText(email);
  await choice.waitFor();
  await popup.waitForTimeout(400);
  await choice.click();
  await expect(page.locator('main h3').first()).toBeVisible({ timeout: 20_000 });
}

/** Runs a header action: behind the ☰ menu on phones, a labelled icon on larger screens. */
export async function headerAction(page: Page, name: 'Print registreren' | 'Levering registreren' | 'Instellingen' | 'Uitloggen') {
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  if (await menu.isVisible()) {
    await menu.click();
    await page.getByRole('menuitem', { name }).click();
  } else {
    await page.getByRole('button', { name, exact: true }).click();
  }
}

/** The card of a filament, by color name without the product code (as shown on the card). */
export const card = (page: Page, colorName: string) =>
  page.locator('main .grid > button').filter({ has: page.getByRole('heading', { name: colorName, exact: true }) });

export const test = base.extend<{ inventory: SeedFilament[]; account: { uid: string; email: string }; signedIn: Page }>({
  inventory: [INVENTORY, { option: true }],
  account: async ({ inventory }, use, testInfo) => {
    const email = `e2e-${testInfo.testId}-${Date.now()}@example.com`.toLowerCase();
    const uid = await createAccount(email);
    await seed(uid, inventory);
    await use({ uid, email });
  },
  signedIn: async ({ page, account }, use) => {
    await signIn(page, account.email);
    await use(page);
  },
});

export { expect };
