import { card, expect, headerAction, test } from './fixtures';

test('without a connection, a print shows why it failed and keeps the input', async ({ signedIn: page, context }) => {
  await headerAction(page, 'Print registreren');
  const input = page.getByLabel('Gram gebruikt van Rood (10200)');
  await input.fill('50');

  await context.setOffline(true);
  await page.getByRole('button', { name: 'Bevestig 50 g' }).click();
  await expect(page.getByRole('alert')).toContainText('Print registreren is mislukt.');
  await expect(page.getByRole('alert')).toContainText('Geen verbinding');
  await expect(input).toHaveValue('50');

  // Retrying works once the connection is back
  await context.setOffline(false);
  await page.getByRole('button', { name: 'Bevestig 50 g' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(card(page, 'Rood')).toContainText('823 g');
});

test('Escape closes a dialog and gives the focus back', async ({ signedIn: page }) => {
  const opener = page.getByRole('button', { name: 'Filament toevoegen' });
  await opener.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(opener).toBeFocused();
});

test('the share button shares the colors as an image', async ({ signedIn: page, context }) => {
  // Stand-in for the phone's share sheet, capturing what would be shared
  await context.addInitScript(() => {
    navigator.canShare = () => true;
    navigator.share = async ({ files }: ShareData) => {
      (window as unknown as { shared: { name: string; type: string; size: number } }).shared =
        { name: files![0].name, type: files![0].type, size: files![0].size };
    };
  });
  await page.reload();
  await expect(page.locator('main h3').first()).toBeVisible();

  const share = page.getByRole('button', { name: 'Deel deze lijst als afbeelding' });
  await expect(share).toBeEnabled();
  await share.click();
  const shared = await page.waitForFunction(() => (window as unknown as { shared?: unknown }).shared).then(h => h.jsonValue()) as { name: string; type: string; size: number };
  expect(shared.type).toBe('image/png');
  expect(shared.name).toMatch(/^filament-voorraad-\d{4}-\d{2}-\d{2}\.png$/);
  expect(shared.size).toBeGreaterThan(10_000);
});

test('without file sharing, the button saves the image', async ({ signedIn: page, context }) => {
  await context.addInitScript(() => { (navigator as { canShare?: unknown }).canShare = undefined; });
  await page.reload();
  const save = page.getByRole('button', { name: 'Bewaar deze lijst als afbeelding' });
  await expect(save).toBeEnabled();
  const [download] = await Promise.all([page.waitForEvent('download'), save.click()]);
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
