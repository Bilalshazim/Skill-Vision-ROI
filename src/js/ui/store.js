/* Stato condiviso dell'interfaccia. */
export const store = {
  S: null,          /* stato corrente del modello */
  initial: null,    /* dati di partenza: campione o dati incorporati in una copia salvata */
  embedded: false,  /* true se i dati di partenza vengono da una copia salvata */
  pristine: "",     /* HTML della pagina prima del primo render, base per «Salva copia» */
  lastFile: null,   /* ultimo file importato, riletto da «AGGIORNA IL DATO» */
  lastSeen: {}      /* voci trovate nell'ultimo import */
};
