import { card, expect, test } from './fixtures';

test('shows "Bijna op" and "Beperkt" only on low stock', async ({ signedIn: page }) => {
  await expect(card(page, 'Cyaan')).toContainText('Bijna op');      // 150 g
  await expect(card(page, 'Transparant')).toContainText('Beperkt'); // 420 g
  for (const plenty of ['Asgrijs', 'Rood', 'Geel']) {
    await expect(card(page, plenty)).not.toContainText(/Bijna op|Beperkt/);
  }
});

test('filters on nearly empty filament', async ({ signedIn: page }) => {
  await page.getByRole('button', { name: 'Bijna op · 1' }).click();
  await expect(page.locator('main h3')).toHaveText(['Cyaan']);
  await page.getByRole('button', { name: 'Alle', exact: true }).click();
  await expect(page.locator('main h3')).toHaveCount(6);
});

test('sorts by stock, and reverses on a second choice', async ({ signedIn: page }, testInfo) => {
  const sortBy = async (label: string) => {
    if (testInfo.project.name === 'phone') {
      await page.getByRole('button', { name: /^Sorteer/ }).click();
      await page.getByRole('menuitem', { name: label }).click();
    } else {
      await page.getByRole('button', { name: label, exact: true }).click();
    }
  };
  await sortBy('Voorraad');
  await expect(page.locator('main h3').first()).toHaveText('Zwart');
  await sortBy('Voorraad');
  await expect(page.locator('main h3').first()).toHaveText('Cyaan');
});

test('searches on color, type and brand', async ({ signedIn: page }) => {
  const search = page.getByPlaceholder('Zoek kleur, type of merk...');
  await search.fill('matte');
  await expect(page.locator('main h3')).toHaveText(['Asgrijs']);
  await search.fill('xyz');
  await expect(page.getByText('Geen resultaten gevonden')).toBeVisible();
});

test('fits the screen without sideways scrolling', async ({ signedIn: page }) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBe(0);
  const titleFits = await page.locator('h1').evaluate(h => h.scrollWidth <= h.clientWidth);
  expect(titleFits).toBe(true);
});

test('all cards in the grid are the same height, including "Voeg filament toe"', async ({ signedIn: page }) => {
  // offsetHeight is the laid-out height, not affected by the cards' entry animation (a scale)
  const heights = await page.locator('main .grid > button').evaluateAll(els => els.map(el => (el as HTMLElement).offsetHeight));
  expect(heights.length).toBe(7);
  expect(new Set(heights).size).toBe(1);
});

test('notes show in the edit form, not on the card', async ({ signedIn: page }) => {
  await expect(card(page, 'Rood')).not.toContainText('AMS slot 1');
  await card(page, 'Rood').click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Bewerk filament' })).toBeVisible();
  await expect(page.getByRole('dialog').getByPlaceholder('bijv. AMS slot 1')).toHaveValue('AMS slot 1');
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Annuleer' })).toBeVisible();
});

test('adding a filament uses "Voeg toe" and "Annuleer"', async ({ signedIn: page }) => {
  await page.getByRole('button', { name: 'Voeg filament toe' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Voeg filament toe' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Voeg toe', exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Annuleer' })).toBeVisible();
});

test('shows weights in grams and kilograms, never in spools', async ({ signedIn: page }) => {
  await expect(card(page, 'Rood')).toContainText('873 g');
  await expect(card(page, 'Zwart')).toContainText('3,8 kg');
  await expect(page.locator('main')).not.toContainText(/\brol(len)?\b/);
});
