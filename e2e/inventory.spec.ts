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
      await page.getByRole('button', { name: /^Sorteren/ }).click();
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
