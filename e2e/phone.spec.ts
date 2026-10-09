import { expect, test } from './fixtures';

// Behavior that only exists on narrow screens
test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'phone', 'phone layout only'));

test('all header actions are behind the menu', async ({ signedIn: page }) => {
  await expect(page.getByRole('button', { name: 'Registreer print', exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await expect(page.getByRole('menuitem')).toHaveText(['Registreer print', 'Registreer levering', 'Instellingen', 'Log uit']);
});

test('the open menu covers the toolbar, and a tap outside only closes it', async ({ signedIn: page }) => {
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const sort = await page.getByRole('button', { name: /^Sorteer/ }).boundingBox();
  const onTop = await page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest('[role=menu]'), { x: sort!.x + sort!.width / 2, y: sort!.y + sort!.height / 2 });
  expect(onTop).toBe(true);

  await page.mouse.click(30, 700);
  await expect(page.getByRole('menu')).toBeHidden();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('logs out from the menu', async ({ signedIn: page }) => {
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Log uit' }).click();
  await expect(page.getByRole('button', { name: 'Log in met Google' })).toBeVisible();
});
