import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Lezioni di teoria, scritte in MDX in `src/content/lezioni/<lingua>/<NN>-<slug>.mdx`.
 * Sono modellate già come capitoli di un volume: quando la teoria confluirà nel libro si spostano così come sono.
 */
const lezioni = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/lezioni' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    capitolo: z.enum(['rappresentare-i-numeri']),
    ordine: z.number().int().nonnegative(),
    /** Che cosa lo studente sa fare alla fine della lezione. */
    obiettivi: z.array(z.string()).default([]),
    livello: z.enum(['base', 'avanzato']).default('base'),
    /** Le bozze mostrano un avviso finché l’autore non le approva. */
    stato: z.enum(['bozza', 'rivista']).default('bozza'),
    fonti: z.array(reference('fonti')).default([]),
  }),
});

/** Bibliografia: ogni citazione nei testi rimanda a una voce di questa collezione. */
const fonti = defineCollection({
  loader: file('./src/content/fonti.yaml'),
  schema: z.object({
    autori: z.string(),
    titolo: z.string(),
    editore: z.string().optional(),
    anno: z.number().int().optional(),
    url: z.url().optional(),
    note: z.string().optional(),
  }),
});

export const collections = { lezioni, fonti };
