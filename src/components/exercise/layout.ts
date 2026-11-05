/**
 * Disposizione della correzione in modalità LIM (variante `fit:`): consegna, esito e pulsante a sinistra, procedimento
 * a destra, così tutto sta nello schermo. Fuori dalla LIM restano una colonna sola, nello stesso ordine di lettura.
 */
export const REVIEW_GRID =
  'flex flex-col gap-4 fit:my-auto fit:grid fit:grid-cols-[minmax(11rem,18rem)_minmax(0,1fr)] fit:grid-rows-[auto_auto_1fr] fit:items-start fit:gap-x-8';

/** La consegna ripetuta sopra l’esito, più grande sulla LIM. */
export const REVIEW_SOURCE = 'text-center text-2xl fit:text-4xl';

/** Il procedimento, nella colonna di destra. */
export const REVIEW_SOLUTION = 'fit:col-start-2 fit:row-span-3 fit:row-start-1';

/** Il pulsante per andare avanti, sotto l’esito. */
export const REVIEW_BUTTON = 'fit:col-start-1 fit:row-start-3';
