import { expect, headerAction, test } from './fixtures';

test('settings are a page with the types, not a dialog', async ({ signedIn: page }) => {
  await headerAction(page, 'Instellingen');
  await expect(page).toHaveURL(/#instellingen/);
  await expect(page.getByRole('heading', { name: 'Filamenttypes' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Ingelogd als')).toHaveCount(0); // no account section any more

  await page.getByRole('button', { name: 'Ga terug naar de voorraad' }).click();
  await expect(page.locator('main h3').first()).toBeVisible();
});

test('renames a type, also on the cards', async ({ signedIn: page }, testInfo) => {
  await headerAction(page, 'Instellingen');
  await page.getByRole('list', { name: 'Types' }).getByRole('button', { name: /^PLA Matte/ }).click();
  const name = page.getByRole('region', { name: 'Type PLA Matte' }).getByLabel('Naam', { exact: true });
  await name.fill('PLA Mat');
  // Phones go back to the list first; larger screens show the list next to the type
  if (testInfo.project.name === 'phone') await page.getByRole('button', { name: 'Toon alle types' }).click();
  await page.getByRole('button', { name: 'Ga terug naar de voorraad' }).click();
  await expect(page.locator('main .grid > button', { hasText: 'Asgrijs' })).toContainText('PLA Mat');
});

test('the back button of the browser returns from a type to the list', async ({ signedIn: page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone', 'phones open a type on its own');
  await headerAction(page, 'Instellingen');
  await page.getByRole('list', { name: 'Types' }).getByRole('button', { name: /^PLA Basic/ }).click();
  await expect(page.getByRole('list', { name: 'Types' })).toBeHidden();
  await page.goBack();
  await expect(page.getByRole('list', { name: 'Types' })).toBeVisible();

  // The arrow at the top does the same, so there is only one way back on screen
  await page.getByRole('list', { name: 'Types' }).getByRole('button', { name: /^PLA Basic/ }).click();
  await expect(page.getByRole('heading', { name: 'PLA Basic' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ga terug naar de voorraad' })).toBeHidden();
  await page.getByRole('button', { name: 'Toon alle types' }).click();
  await expect(page.getByRole('list', { name: 'Types' })).toBeVisible();
});

test('adding a type without a connection says it failed', async ({ signedIn: page, context }) => {
  await headerAction(page, 'Instellingen');
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Voeg type toe' }).click();
  await expect(page.getByRole('alert')).toContainText('Type toevoegen is mislukt.');
  await context.setOffline(false);
});
