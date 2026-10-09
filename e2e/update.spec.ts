import { expect, test } from './fixtures';

const online = (version: string) => ({ status: 200, contentType: 'application/json', body: JSON.stringify({ version }) });

test('a newer version online shows a notice with a button to reload', async ({ signedIn: page }) => {
  await page.route('**/version.json*', route => route.fulfill(online('99.0.0')));
  await page.reload();
  const notice = page.getByRole('status').filter({ hasText: 'Nieuwe versie' });
  await expect(notice).toContainText('v99.0.0');

  // Closing hides it for that version, also when the app comes back to the front
  await notice.getByRole('button', { name: 'Sluit melding' }).click();
  await expect(notice).toBeHidden();
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForTimeout(500);
  await expect(notice).toBeHidden();

  // "Vernieuw" reloads the page
  await page.route('**/version.json*', route => route.fulfill(online('99.0.1')));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(notice).toContainText('v99.0.1');
  await Promise.all([page.waitForEvent('load'), notice.getByRole('button', { name: 'Vernieuw' }).click()]);
});

test('no notice when the same version is online', async ({ signedIn: page }) => {
  const version = (await page.locator('footer').innerText()).match(/v(\d+\.\d+\.\d+)/)![1];
  await page.route('**/version.json*', route => route.fulfill(online(version)));
  await page.reload();
  await page.locator('main h3').first().waitFor();
  await page.waitForTimeout(500);
  await expect(page.getByText('Nieuwe versie')).toHaveCount(0);
});
