/**
 * Costruisce un URL interno che rispetta `base` (oggi `/` sul sottodominio, ma i link restano validi se il sito viene spostato).
 * Accetta percorsi come `sfida/` o `/sfida/`.
 */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const clean = path.replace(/^\//, '');
  return base + clean;
}
