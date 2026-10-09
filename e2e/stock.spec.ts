import { card, expect, headerAction, test } from './fixtures';

test('a print subtracts the grams used', async ({ signedIn: page }) => {
  await headerAction(page, 'Registreer print');
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Gram gebruikt van Rood (10200)').fill('120');
  await expect(dialog.getByText('873 g → 753 g')).toBeVisible();
  await dialog.getByRole('button', { name: 'Bevestig 120 g' }).click();
  await expect(dialog).toBeHidden();
  await expect(card(page, 'Rood')).toContainText('753 g');
});

test('a print warns when there is not enough left', async ({ signedIn: page }) => {
  await headerAction(page, 'Registreer print');
  await page.getByLabel('Gram gebruikt van Cyaan (10600)').fill('400');
  await expect(page.getByRole('dialog').getByText('250 g te weinig')).toBeVisible();
});

test('a delivery adds whole spools', async ({ signedIn: page }) => {
  await headerAction(page, 'Registreer levering');
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('1 kg meer Geel (10401)').click();
  await expect(dialog.getByText('1 kg → 2 kg')).toBeVisible();
  await dialog.getByRole('button', { name: 'Voeg 1 kg toe' }).click();
  await expect(dialog).toBeHidden();
  await expect(card(page, 'Geel')).toContainText('2 kg');
});

test('adds, then deletes a filament', async ({ signedIn: page }) => {
  await page.getByRole('button', { name: 'Voeg filament toe' }).click();
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

test('the confirm button pulses once there is something to confirm', async ({ signedIn: page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await headerAction(page, 'Registreer print');
  const confirm = page.getByRole('dialog').getByRole('button', { name: /Bevestig/ });
  await expect(confirm).toHaveCSS('animation-name', 'none');
  await page.getByLabel('Gram gebruikt van Rood (10200)').fill('50');
  await expect(confirm).toHaveCSS('animation-name', 'attention');

  // Not for people who prefer less motion
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(confirm).toHaveCSS('animation-name', 'none');
});
