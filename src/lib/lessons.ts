import type { CollectionEntry } from 'astro:content';
import { defaultLocale, type Locale } from '@/i18n';

/** I file delle lezioni stanno in `src/content/lezioni/<lingua>/<NN>-<slug>.mdx`. */
export function lessonLocale(lezione: CollectionEntry<'lezioni'>): string {
  return lezione.id.split('/')[0] ?? defaultLocale;
}

/** Slug pubblico: senza prefisso di lingua e senza numero d’ordine. */
export function lessonSlug(lezione: CollectionEntry<'lezioni'>): string {
  const name = lezione.id.split('/').at(-1) ?? lezione.id;
  return name.replace(/^\d+-/, '');
}

export function isLessonIn(lezione: CollectionEntry<'lezioni'>, locale: Locale = defaultLocale) {
  return lessonLocale(lezione) === locale;
}
