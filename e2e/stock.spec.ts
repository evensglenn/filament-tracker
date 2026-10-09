import { card, expect, headerAction, test } from './fixtures';

test('a print subtracts the grams used', async ({ signedIn: page }) => {
  await headerAction(page, 'Print registreren');
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Gram gebruikt van Rood (10200)').fill('120');
  await expect(dialog.getByText('873 → 753 g')).toBeVisible();
  await dialog.getByRole('button', { name: 'Bevestig 120 g' }).click();
  await expect(dialog).toBeHidden();
  await expect(card(page, 'Rood')).toContainText('753 g');
});

test('a print warns when there is not enough left', async ({ signedIn: page }) => {
  await headerAction(page, 'Print registreren');
  await page.getByLabel('Gram gebruikt van Cyaan (10600)').fill('400');
  await expect(page.getByRole('dialog').getByText('250 g te weinig')).toBeVisible();
});

test('a delivery adds whole spools', async ({ signedIn: page }) => {
  await headerAction(page, 'Levering registreren');
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Eén rol meer Geel (10401)').click();
  await dialog.getByRole('button', { name: 'Voeg 1 rol toe' }).click();
  await expect(dialog).toBeHidden();
  await expect(card(page, 'Geel')).toContainText('2000 g');
});

test('adds, then deletes a filament', async ({ signedIn: page }) => {
  await page.getByRole('button', { name: 'Filament toevoegen' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Magenta (10201)' }).click();
  await expect(dialog.getByPlaceholder('bijv. Jadewit')).toHaveValue('Magenta (10201)');
  await dialog.getByRole('button', { name: 'Voeg toe', exact: true }).click();
  await expect(card(page, 'Magenta')).toBeVisible();

  await card(page, 'Magenta').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Verwijder filament' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Verwijder', exact: true }).click();
  await expect(card(page, 'Magenta')).toHaveCount(0);
});
