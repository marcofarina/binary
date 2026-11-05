import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

/** Legge la consegna dagli attributi e calcola la risposta giusta. */
async function solution(page: Page): Promise<string> {
  const prompt = page.getByTestId('consegna');
  const from = Number(await prompt.getAttribute('data-from'));
  const to = Number(await prompt.getAttribute('data-to'));
  const source = (await prompt.getAttribute('data-source')) ?? '';
  return parseInt(source, from).toString(to).toUpperCase();
}

/** Axe sui messaggi a comparsa misurerebbe colori a metà dissolvenza: si aspetta che spariscano. */
async function axe(page: Page) {
  await expect(page.getByTestId('messaggi').locator('p')).toHaveCount(0, { timeout: 4000 });
  return (await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations;
}

async function answerCorrectly(page: Page) {
  const before = await page.getByTestId('consegna').getAttribute('data-source');
  await page.getByLabel(/Risposta in base/).fill(await solution(page));
  await page.getByRole('button', { name: 'Verifica' }).click();
  await expect(page.getByTestId('consegna')).not.toHaveAttribute('data-source', before ?? '', { timeout: 3000 });
}

async function answerWrongly(page: Page) {
  const right = await solution(page);
  const wrong = right.endsWith('1') ? `${right.slice(0, -1)}0` : `${right.slice(0, -1)}1`;
  await page.getByLabel(/Risposta in base/).fill(wrong);
  await page.getByRole('button', { name: 'Verifica' }).click();
}

test.describe('sfida', () => {
  test.use({ reducedMotion: 'reduce' });

  test('endless: tre giuste fanno salire di livello, un errore mostra il procedimento e fa scendere', async ({
    page,
  }) => {
    await page.goto('sfida/?codice=4827');
    await expect(page.getByLabel('Endless')).toBeChecked();
    await page.getByRole('button', { name: 'Inizia' }).click();
    await expect(page.getByTestId('livello')).toHaveAttribute('data-level', 'easy');

    for (let i = 0; i < 3; i++) await answerCorrectly(page);
    await expect(page.getByTestId('streak')).toContainText('3');
    await expect(page.getByTestId('livello')).toHaveAttribute('data-level', 'medium');
    await expect(page.getByTestId('punti')).toHaveText('30');

    expect(await axe(page)).toEqual([]);

    await answerWrongly(page);
    await expect(page.getByRole('heading', { name: 'Il procedimento' })).toBeVisible();
    await expect(page.getByTestId('diagnosi')).not.toBeEmpty();
    await expect(page.getByTestId('streak')).toContainText('0');
    await expect(page.getByTestId('livello')).toHaveAttribute('data-level', 'easy');
    await expect(page.getByTestId('punti')).toHaveText('30');
    expect(await axe(page)).toEqual([]);

    await page.getByRole('button', { name: 'Avanti' }).click();
    await page.getByRole('button', { name: 'Termina' }).click();
    await expect(page.getByRole('heading', { name: 'Partita finita' })).toBeVisible();
    await expect(page.getByText('Nuovo record!')).toBeVisible();
    await expect(page.getByText('?codice=4827')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Partita finita' })).toHaveCSS('opacity', '1');
    expect(await axe(page)).toEqual([]);

    await page.getByRole('button', { name: 'Gioca ancora' }).click();
    await expect(page.getByText('Punteggio migliore: 30')).toBeVisible();
  });

  test('una cifra non valida non conta come errore', async ({ page }) => {
    await page.goto('sfida/');
    await page.getByRole('button', { name: 'Inizia' }).click();
    await page.getByLabel(/Risposta in base/).fill('Z');
    await expect(page.getByText(/La cifra Z non esiste/)).toBeVisible();
    await page.getByRole('button', { name: 'Verifica' }).click();
    await expect(page.getByRole('heading', { name: 'Il procedimento' })).toHaveCount(0);
    await expect(page.getByTestId('streak')).toContainText('0');
  });

  test('a vite: tre errori chiudono la partita', async ({ page }) => {
    await page.goto('sfida/?modalita=vite&codice=99');
    await expect(page.getByLabel('A vite')).toBeChecked();
    await page.getByRole('button', { name: 'Inizia' }).click();
    for (let i = 0; i < 3; i++) {
      await answerWrongly(page);
      await page.getByRole('button', { name: i < 2 ? 'Avanti' : 'Partita finita' }).click();
    }
    await expect(page.getByRole('heading', { name: 'Partita finita' })).toBeVisible();
  });

  test('lo stesso codice sfida dà lo stesso primo esercizio a tutta la classe', async ({ page }) => {
    const first = async () => {
      await page.goto('sfida/?codice=123456');
      await page.getByRole('button', { name: 'Inizia' }).click();
      return page.getByTestId('consegna').getAttribute('data-source');
    };
    const mine = await first();
    // Un altro studente: stesso codice, browser senza storico.
    await page.evaluate(() => localStorage.clear());
    expect(await first()).toBe(mine);
  });

  test('rigiocando lo stesso codice gli esercizi già visti non tornano', async ({ page }) => {
    const first = async () => {
      await page.goto('sfida/?codice=123456');
      await page.getByRole('button', { name: 'Inizia' }).click();
      return page.getByTestId('consegna').getAttribute('data-source');
    };
    const once = await first();
    expect(await first()).not.toBe(once);
  });
});

test('allenamento: conversione scelta, risposta giusta e procedimento', async ({ page }) => {
  await page.goto('allenamento/');
  await page.getByLabel('Conversione').selectOption('10-16');
  await expect(page.getByTestId('consegna')).toHaveAttribute('data-to', '16');
  await page.getByLabel(/Risposta in base/).fill(await solution(page));
  await page.getByRole('button', { name: 'Verifica' }).click();
  await expect(page.getByText('Giusto!')).toBeVisible();
  await page.getByRole('button', { name: 'Mostra il procedimento' }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByText('Giuste: 1 su 1')).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations).toEqual([]);
});
