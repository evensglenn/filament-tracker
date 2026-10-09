import { expect, test } from './fixtures';

test('the footer shows the version and switches the theme, remembered after a reload', async ({ signedIn: page }) => {
  const footer = page.locator('footer');
  await expect(footer).toContainText(/^v\d+\.\d+\.\d+$/m);
  await expect(footer).not.toContainText('Filament tracker');
  await expect(footer.getByRole('img', { name: 'Studio Evens' })).toBeVisible();

  await footer.getByRole('button', { name: 'Donker' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(footer.getByRole('button', { name: 'Donker' })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await footer.getByRole('button', { name: 'Automatisch (zoals het toestel)' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
});

test('the light page is kalk', async ({ signedIn: page }) => {
  await page.getByRole('button', { name: 'Licht' }).click();
  await expect(page.locator('.min-h-screen')).toHaveCSS('background-color', 'rgb(238, 236, 231)');
});

test('automatic follows a dark device', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto('/');
  const background = await page.locator('.min-h-screen').evaluate(el => getComputedStyle(el).backgroundColor);
  await context.close();
  // House style: a deep antraciet page in dark mode (kalk #EEECE7 in light mode)
  expect(background).toBe('rgb(33, 35, 37)');
});

test('"Log in met Google" pulses, unless less motion is preferred', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const login = page.getByRole('button', { name: 'Log in met Google' });
  await expect(login).toHaveCSS('animation-name', 'attention');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(login).toHaveCSS('animation-name', 'none');
});
