/* Fonti bibliografiche e normative citate dal modello, e voci di bilancio usate. */

/* [affermazione, fonte, dato utilizzato, limite, uso nel modello] */
export const SOURCES = [
  ["HCVA e moltiplicatore del capitale umano","Fitz-enz J., <em>The ROI of Human Capital</em>, AMACOM, 2000 (2ª ed. 2009); formule riprese in <em>The E-Aligned Enterprise</em>, AMACOM, 2001.","HC ROI = (Ricavi − (Spese operative − Costo del lavoro)) ÷ Costo del lavoro; HCVA = stesso numeratore ÷ FTE.","Misura di efficienza, non di causalità. Fitz-enz usa i ricavi: qui adattata al valore della produzione e alla classe B.","Base della leva 1; moltiplicatore in metodologia."],
  ["Schema di conto economico ed EBIT","Art. 2425 c.c.; OIC 12, «Composizione e schemi del bilancio d'esercizio».","Differenza fra valore e costi della produzione (A − B).","A − B include componenti accessorie; l'EBITDA non è una voce dello schema e va ricostruito.","EBIT ricalcolato, EBITDA per convenzione dichiarata."],
  ["Costo di sostituzione 50–200% della RAL","Gallup, McFeely S. e Wigert B., «This Fixable Problem Costs U.S. Businesses $1 Trillion», 13 marzo 2019.","«One-half to two times the employee's annual salary».","Mercato statunitense, stima aggregata per ruolo: non è una tariffa applicabile automaticamente.","Intervallo del cursore; il default 50% ne è l'estremo inferiore."],
  ["Costo di sostituzione 90–200% della RAL","Allen D.G., <em>Retaining Talent</em>, SHRM Foundation, Effective Practice Guidelines, 2008.","«Total costs associated with turnover ranging from 90% to 200% of annual salary».","Mercato statunitense, include costi indiretti.","Conferma che il default 50% è prudenziale. Nella v3 l'intervallo 50–200% era attribuito per errore a SHRM."],
  ["Indennità di malattia","INPS, regime dell'indennità di malattia dei lavoratori dipendenti; sintesi in Fiscoetasse, «Indennità di malattia: quali quote sono a carico INPS e quali del datore di lavoro».","Carenza 1–3 giorni a carico del datore; per le categorie indennizzate 50% dal 4° al 20° giorno e 66,66% dal 21° al 180°; impiegati dell'industria e quadri esclusi dall'indennità INPS, a carico del datore; integrazioni da CCNL.","Il costo effettivo dipende da qualifica, settore e CCNL; le assenze diverse dalla malattia seguono altri regimi.","Quota a carico azienda: default 60% come ipotesi, da sostituire con il dato dei cedolini."],
  ["Correlazione fra disingaggio, assenze e turnover","Gallup, «Employee Engagement and Performance: Latest Insights From the World's Largest Study» (Q12 Meta-Analysis), 2020.","Unità nel quartile superiore di engagement contro quello inferiore: −81% assenteismo, −18% / −43% turnover, +14% produttività.","Riguarda l'engagement, non le competenze; correlazione, non causalità.","Nessun parametro. Documenta perché le leve sono causalmente correlate (matrice di sovrapposizione)."],
  ["Competenze e prestazione","Spencer L.M. e Spencer S.M., <em>Competence at Work</em>, Wiley, 1993.","Quadro concettuale del legame fra competenze e prestazione superiore.","Non fornisce coefficienti di recuperabilità: non giustifica le percentuali di scenario.","Solo quadro teorico dell'assessment."],
  ["Valore delle pratiche HR","Ulrich D. e Brockbank W., <em>The HR Value Proposition</em>, Harvard Business School Press, 2005.","Quadro di attribuzione del valore alla funzione HR.","Nessun dato quantitativo.","Solo quadro teorico."],
  ["Trasparenza retributiva","Direttiva (UE) 2023/970.","Obblighi di criteri oggettivi di valutazione delle mansioni.","Normativo, non economico.","Solo valore non monetizzato."],
  ["Elasticità, attuabilità, riduzioni di turnover e assenze","Ipotesi interne SKILL-VISION.","Valori di scenario prudenziale, base ed espansivo.","Nessuna fonte esterna. Vanno calibrate con dati aziendali e verificate a consuntivo.","Leve 1, 2 e 3; segnalate come «ipotesi» finché non calibrate."]
];

/* [voce, ruolo nel modello, obbligatoria] */
export const VOCI = [
  ["Valore della produzione (A)","Base dell'HCVA. Si usa questa e non i ricavi operativi, perché include variazione delle rimanenze e dei lavori in corso.","Sì"],
  ["Totale costi della produzione (B)","Con A determina l'EBIT ricalcolato e l'HCVA.","Sì"],
  ["Costo del personale (B9)","Base delle assenze e denominatore del moltiplicatore del capitale umano.","Sì"],
  ["Salari e stipendi (B9a)","RAL media, base del costo di sostituzione. Il rapporto con B9 varia per azienda e viene calcolato, non assunto.","Sì"],
  ["Numero dipendenti","Trasforma le percentuali dell'assessment in persone e le grandezze di bilancio in valori pro capite.","Sì"],
  ["Ammortamenti e svalutazioni (B10)","Ricostruzione dell'EBITDA; differenza fra valore aggiunto e HCVA.","Consigliata"],
  ["Accantonamenti (B12 + B13)","Ricostruzione dell'EBITDA nella convenzione gestionale.","Consigliata"],
  ["Risultato ante imposte e imposte","Aliquota effettiva, per il beneficio dopo imposte.","Consigliata"],
  ["Utile netto","Termine di paragone dell'impatto del beneficio.","Consigliata"],
  ["ROCE","Soglia di rendimento da battere, con convenzione dichiarata.","Consigliata"],
  ["EBIT ed EBITDA dichiarati","Solo per il controllo di quadratura: il modello usa i valori ricalcolati.","Facoltativa"],
  ["ROI e ROS aziendali","Contesto di redditività per il confronto.","Facoltativa"],
  ["Crescita del valore della produzione","Qualifica la scopertura di ruolo come vincolo alla crescita.","Facoltativa"],
  ["Costo per servizi (B7)","Contiene la spesa per selezione esterna: riferimento commerciale, non entra nel calcolo.","Facoltativa"]
];
