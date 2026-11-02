import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const lessons = [
  'che-cos-e-una-base',
  'da-una-base-al-decimale',
  'dal-decimale-a-una-base',
  'binario-ottale-esadecimale',
  'il-binario-nella-memoria',
  'l-ottale-nei-permessi',
  'l-esadecimale-nei-colori',
];

for (const scheme of ['light', 'dark'] as const) {
  for (const slug of lessons) {
    test(`la lezione ${slug} (${scheme}) si carica ed è accessibile con i widget attivi`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      const response = await page.goto(`teoria/${slug}/`);
      expect(response?.ok()).toBe(true);
      await expect(page.locator('h1')).toHaveCount(1);
      // I widget sono client:visible: scorrendo la pagina si idratano tutti.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 400) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 50));
        }
      });
      await expect(page.locator('astro-island[ssr]')).toHaveCount(0);

      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations).toEqual([]);
    });
  }
}

test('l’indice della teoria elenca le sette lezioni', async ({ page }) => {
  await page.goto('teoria/');
  for (const slug of lessons) await expect(page.locator(`a[href$="/teoria/${slug}/"]`)).toHaveCount(1);
});

test('i link delle lezioni aprono l’allenamento sulla conversione giusta', async ({ page }) => {
  await page.goto('allenamento/?conversione=2-8&livello=medium');
  await expect(page.getByLabel(/conversione/i)).toHaveValue('2-8');
  await expect(page.getByLabel(/livello/i)).toHaveValue('medium');
});
