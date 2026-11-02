import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = ['', 'sfida/', 'allenamento/', 'teoria/', 'docenti/', 'schede/'];

for (const path of pages) {
  test(`la pagina /${path} si carica ed è accessibile`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.ok()).toBe(true);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page).toHaveTitle(/Binary/);

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('il tema scuro si attiva, viene ricordato ed è accessibile', async ({ page }) => {
  await page.goto('');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.getByRole('button', { name: /tema/i }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});
