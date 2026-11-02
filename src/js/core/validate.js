/* Controlli automatici sui dati. Livelli: bad (bloccante) · warn · info · ok. */
import { CALKEYS } from "./defaults.js";
import { calibCount } from "./scenarios.js";
import { eur, num, pct, art } from "./format.js";
import { normPiva, pivaValid, atecoValid } from "./anagrafica.js";

/* tolleranza per le quadrature contabili */
export function tolerance(s){ return Math.max(2,(+s.vdp||0)*0.0005); }

export function validate(s, m){
  const out=[];
  function add(l,t){ out.push({l:l,t:t}); }
  const miss=[];
  if(!(s.N>0)) miss.push("numero dipendenti");
  if(!(s.vdp>0)) miss.push("valore della produzione");
  if(!(s.costiProd>0)) miss.push("totale costi della produzione");
  if(!(s.cp>0)) miss.push("costo del personale");
  if(!(s.inv>0)) miss.push("corrispettivo dell'assessment");
  if(miss.length) add("bad","Dati essenziali mancanti: "+miss.join(", ")+". Senza questi il motore non produce un risultato.");
  if(s.cp>0 && s.vdp>0 && +s.cp > +s.vdp) add("bad","Il costo del personale supera il valore della produzione: verifica le voci o l'unità di misura.");
  if(s.sal>0 && s.cp>0 && +s.sal > +s.cp) add("bad","Salari e stipendi superano il costo del personale: le due voci sono invertite o in unità diverse.");
  if(s.N>0 && s.vdp>0 && s.vdp/s.N < 10000) add("warn","Valore della produzione per dipendente sotto 10.000 €: gli importi sembrano in migliaia di euro. Vanno inseriti in euro.");
  if(m.hasAB && s.cp>0 && m.HCVA<=0) add("bad","L'HCVA è negativo o nullo: il capitale umano non genera valore aggiunto positivo e la leva di produttività non è applicabile.");
  if(m.hasAB && !(m.EBITDA>0)) add("warn","EBITDA negativo o nullo: impatto sulla marginalità e giorni di EBITDA non sono significativi.");
  [["comp","Valore competenze",0,100],["cov","Copertura ruoli",0,100],["turn","Turnover",0,100],["ass","Assenteismo",0,50],["gap","GAP",0,50]].forEach(function(r){
    const v=+s[r[0]]; if(v<r[2]||v>r[3]) add("bad",r[1]+" fuori dall'intervallo ammesso ("+r[2]+"–"+r[3]+").");
  });
  if(m.atteso>100) add("bad","Valore competenze + GAP supera 100: i due dati non sono sulla stessa scala.");
  else if(m.atteso>95) add("info","Valore atteso medio implicito "+num(m.atteso,1)+" punti: verifica che GAP e valore competenze siano sulla stessa scala, in punti assoluti e sulla stessa popolazione. È un avviso, non una prova di sovrastima.");

  const tol=tolerance(s);
  if(m.hasAB && s.ebit){
    if(Math.abs(s.ebit-m.ebitAB)<=tol) add("ok","EBIT dichiarato coincidente con A − B.");
    else add("warn","L'EBIT dichiarato ("+eur(s.ebit)+") differisce da A − B ("+eur(m.ebitAB)+"). Il modello usa il valore ricalcolato.");
  }
  if(m.hasAB && s.ebitda){
    const eg=m.EBIT+(+s.amm||0)+(+s.acc||0), ep=m.EBIT+(+s.amm||0);
    if(Math.abs(s.ebitda-m.EBITDA)<=tol) add("ok","EBITDA dichiarato coincidente con la convenzione adottata.");
    else if(Math.abs(s.ebitda-eg)<=tol) add("warn","L'EBITDA dichiarato segue la convenzione gestionale, diversa da quella selezionata. Il modello usa la convenzione selezionata.");
    else if(Math.abs(s.ebitda-ep)<=tol) add("warn","L'EBITDA dichiarato segue la convenzione prudente, diversa da quella selezionata. Il modello usa la convenzione selezionata.");
    else add("warn","L'EBITDA dichiarato ("+eur(s.ebitda)+") non quadra con nessuna delle due convenzioni ("+eur(eg)+" gestionale, "+eur(ep)+" prudente): mancano probabilmente accantonamenti o svalutazioni. Il modello usa il valore ricalcolato.");
  }
  if(m.hasAB && s.cp>0) add("ok","Identità verificate: VA − HCVA = ammortamenti"+(s.conv==="prud"?"":" + accantonamenti")+" = "+eur(m.VA-m.HCVA)+".");

  if(!(s.sal>0)) add("warn","Salari e stipendi non indicati: la leva del turnover vale zero.");
  if(s.nVal>0 && s.N>0 && +s.nVal > +s.N) add("warn","Le persone valutate superano l'organico: la base viene limitata al 100%.");
  else if(s.nVal>0 && s.N>0 && +s.nVal !== +s.N) add("info","Persone valutate "+num(+s.nVal)+" su "+num(+s.N)+": il potenziale di produttività è applicato "+art("al",m.popF*100,0)+" della base.");
  if(!(s.invAz>0) && s.inv>0 && m.benefit>0) add("warn","Costo delle azioni di sviluppo non indicato. Il beneficio presuppone interventi successivi all'assessment: senza il loro costo il ROI è sovrastimato. Nello scenario attivo il pareggio regge fino a "+eur(m.maxAz)+" di spesa per azioni.");
  if(m.benefit>0 && m.invTot>0 && m.benefit<=m.invTot) add("warn","Il beneficio atteso non copre l'investimento nel primo anno.");
  if(isFinite(m.shareL1) && m.shareL1>60) add("info",""+art("Il",m.shareL1,0)+" del beneficio viene dalla stima di produttività. Con i soli benefici di costo il ROI è "+pct(m.roiCost,0)+".");
  if(m.l4active && !(s.posVac>0)) add("warn","Leva 4 attiva ma senza posizioni vacanti indicate: vale zero.");
  if(m.l4active) add("info","Leva 4 attiva: le posizioni vacanti indicate non devono includere quelle generate dal turnover valorizzato nella leva 2.");
  if(m.posAssunta && s.cov>0 && s.N>0) add("info","Posizioni in organigramma non indicate: le posizioni non presidiate sono calcolate sull'organico (ipotesi semplificatrice).");
  if(s.piva && String(s.piva).trim()){
    const p=normPiva(s.piva);
    if(!/^\d{11}$/.test(p)) add("warn","La partita IVA deve avere 11 cifre: «"+String(s.piva).trim()+"» ne ha "+p.replace(/\D/g,"").length+".");
    else if(!pivaValid(p)) add("warn","Partita IVA "+p+": la cifra di controllo non è valida. Verifica il numero sulla visura camerale.");
    else add("ok","Partita IVA "+p+" formalmente valida.");
  }
  if(s.ateco && String(s.ateco).trim() && !atecoValid(s.ateco)) add("warn","Codice ATECO «"+String(s.ateco).trim()+"» non nel formato atteso (es. 28.29.30).");
  if(!(s.ante>0)) add("warn","Risultato ante imposte non indicato: il beneficio dopo imposte non è calcolabile.");
  const nc=calibCount(s); if(nc<CALKEYS.length) add("info",(CALKEYS.length-nc)+" ipotesi su "+CALKEYS.length+" non ancora calibrate con dati aziendali.");
  const order={bad:0,warn:1,info:2,ok:3};
  out.sort(function(a,b){return order[a.l]-order[b.l];});
  return out;
}

export function isBlocked(checks){ return checks.some(function(c){return c.l==="bad";}); }
