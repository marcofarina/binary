import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const axe = (page: import('@playwright/test').Page) =>
  new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();

test.describe('modalità LIM', () => {
  test('si attiva dal pulsante, ingrandisce il testo e viene ricordata', async ({ page }) => {
    await page.goto('');
    const before = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
    const button = page.getByRole('button', { name: /LIM/ });
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await button.click();
    await expect(page.locator('html')).toHaveAttribute('data-lim', 'on');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    const after = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
    expect(after).toBeGreaterThan(before);

    await page.goto('sfida/');
    await expect(page.locator('html')).toHaveAttribute('data-lim', 'on');
    await page.goto('sfida/?lim=0');
    await expect(page.locator('html')).not.toHaveAttribute('data-lim', 'on');
  });

  for (const scheme of ['light', 'dark'] as const) {
    test(`resta accessibile in tema ${scheme === 'light' ? 'chiaro' : 'scuro'}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('allenamento/?lim=1');
      await expect(page.locator('html')).toHaveAttribute('data-lim', 'on');
      await expect(page.getByLabel(/conversione/i)).toBeVisible();
      expect((await axe(page)).violations).toEqual([]);
    });
  }

  for (const [width, height] of [
    [1024, 768],
    [1280, 720],
    [1920, 1080],
  ] as const) {
    test(`sfida e allenamento stanno nello schermo senza scorrere (${width} × ${height})`, async ({ page }, info) => {
      test.skip(info.project.name !== 'desktop', 'La disposizione per la LIM vale sugli schermi orizzontali.');
      await page.setViewportSize({ width, height });
      const fits = () =>
        page.evaluate(() => {
          // Né la pagina né il riquadro dell’esercizio (l’unico che potrebbe scorrere) devono avere contenuto nascosto.
          const main = document.querySelector('main');
          const scrollers = [...document.querySelectorAll('main *')].filter((el) =>
            ['auto', 'scroll'].includes(getComputedStyle(el).overflowY),
          );
          return (
            document.documentElement.scrollHeight <= window.innerHeight &&
            main !== null &&
            main.getBoundingClientRect().bottom <= window.innerHeight + 1 &&
            main.scrollHeight <= main.clientHeight + 1 &&
            scrollers.every((el) => el.scrollHeight <= el.clientHeight + 1)
          );
        });

      // Divisioni successive più lunghe del livello difficile: 12 righe.
      await page.goto('allenamento/?lim=1&conversione=10-2&livello=hard');
      await page.getByLabel(/^Risposta/).fill('1');
      await page.getByRole('button', { name: 'Verifica' }).click();
      await expect(page.getByTestId('diagnosi')).toBeVisible();
      expect(await fits()).toBe(true);

      await page.goto('sfida/?lim=1&codice=1');
      expect(await fits()).toBe(true);
      await page.getByRole('button', { name: 'Inizia' }).click();
      await expect(page.getByTestId('consegna')).toBeVisible();
      expect(await fits()).toBe(true);
      await page.getByLabel(/^Risposta/).fill('1');
      await page.getByRole('button', { name: 'Verifica' }).click();
      await expect(page.getByRole('button', { name: 'Avanti' })).toBeInViewport();
      expect(await fits()).toBe(true);
    });
  }
});

test.describe('schede stampabili', () => {
  test('lo stesso codice rigenera la stessa scheda, con le soluzioni', async ({ page }) => {
    await page.goto('schede/?livello=progressive&conversione=all&numero=10&codice=1234');
    const exercises = page.getByTestId('esercizi-scheda').locator('li');
    await expect(exercises).toHaveCount(10);
    const first = await page.getByTestId('esercizi-scheda').innerText();
    await expect(page.getByTestId('soluzioni-scheda').locator('li')).toHaveCount(10);

    await page.reload();
    expect(await page.getByTestId('esercizi-scheda').innerText()).toBe(first);

    await page.getByLabel('Numero di esercizi').selectOption('6');
    await expect(exercises).toHaveCount(6);
    await expect(page).toHaveURL(/numero=6/);

    await page.getByRole('button', { name: 'Nuova scheda' }).click();
    await expect(page).not.toHaveURL(/codice=1234/);
  });

  test('in stampa restano solo scheda e soluzioni', async ({ page }) => {
    await page.goto('schede/?codice=77');
    await page.emulateMedia({ media: 'print' });
    await expect(page.getByRole('button', { name: 'Stampa' })).toBeHidden();
    await expect(page.locator('header').first()).toBeHidden();
    await expect(page.getByTestId('esercizi-scheda')).toBeVisible();
    await expect(page.getByTestId('soluzioni-scheda')).toBeVisible();

    await page.emulateMedia({ media: 'screen' });
    await page.getByLabel(/anche le soluzioni/).uncheck();
    await expect(page.getByTestId('soluzioni-scheda')).toHaveCount(0);
  });
});

test('dalla tastiera il primo tasto Tab porta al salto al contenuto', async ({ page }) => {
  await page.goto('sfida/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: /contenuto/i });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
});

test('con le animazioni ridotte i widget delle lezioni restano usabili', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('teoria/che-cos-e-una-base/');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
  expect((await axe(page)).violations).toEqual([]);
});

test('i bit sono raggruppati a quattro con un margine, senza spazi nel testo', async ({ page }) => {
  await page.goto('schede/?livello=medium&conversione=2-10&numero=6&codice=31');
  const numeral = page.getByTestId('esercizi-scheda').locator('li').first().locator('span[aria-hidden="true"]').first();
  const groups = numeral.locator(':scope > span');
  await expect(groups.nth(1)).toBeAttached();
  for (const text of await groups.allInnerTexts()) expect(text).toMatch(/^[01]{1,4}$/);
});
