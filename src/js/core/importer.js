/* Lettura di file chiave/valore (Excel o CSV) e mappatura sulle voci del modello. Funzioni pure. */
import { normPiva } from "./anagrafica.js";

export const MAP = {
  "azienda":"company","ragione sociale":"company","company":"company",
  "partita iva":"piva","p iva":"piva","piva":"piva","partita iva c f":"piva","partita iva codice fiscale":"piva",
  "settore":"settore","settore di attivita":"settore","descrizione ateco":"settore","attivita":"settore",
  "codice ateco":"ateco","ateco":"ateco","codice attivita ateco":"ateco","codice attivita":"ateco",
  "esercizio":"anno","anno":"anno",
  "dipendenti":"N","numero dipendenti":"N","n dipendenti":"N","organico":"N","fte":"N",
  "investimento":"inv","investimento skill vision":"inv","costo intervento":"inv","costo assessment":"inv","corrispettivo assessment":"inv",
  "persone valutate":"nVal","dipendenti valutati":"nVal","popolazione valutata":"nVal",
  "costo azioni":"invAz","costo azioni di sviluppo":"invAz","costo formazione":"invAz","investimento azioni":"invAz",
  "posizioni in organigramma":"posPrev","posizioni previste":"posPrev","posizioni organigramma":"posPrev",
  "posizioni vacanti":"posVac",
  "accantonamenti":"acc","accantonamenti per rischi e oneri":"acc","altri accantonamenti":"acc","accantonamenti per rischi":"acc",
  "ebit dichiarato":"ebit","ebitda dichiarato":"ebitda",
  "valore competenze":"comp","competenze":"comp",
  "gap":"gap","gap medio":"gap","gap medio vs atteso":"gap","gap vs valore atteso":"gap","gap medio sotto soglia":"gap",
  "copertura ruoli":"cov","copertura":"cov",
  "turnover":"turn",
  "assenteismo":"ass","assenteismo e malattia":"ass","assenteismo malattia":"ass","assenze":"ass",
  "ricavi operativi":"ric","ricavi":"ric",
  "totale valore della produzione":"vdp","valore della produzione":"vdp","valore produzione":"vdp",
  "totale costi della produzione":"costiProd","costi della produzione":"costiProd","costi produzione":"costiProd",
  "costo del personale":"cp","costo personale":"cp",
  "salari e stipendi":"sal","salari":"sal",
  "margine operativo lordo ebitda":"ebitda","ebitda":"ebitda","margine operativo lordo":"ebitda",
  "risultato operativo ebit":"ebit","ebit":"ebit","risultato operativo":"ebit",
  "ammortamenti e svalutazioni":"amm","ammortamenti":"amm",
  "utile perdita dell esercizio":"un","utile netto":"un","utile dell esercizio":"un",
  "risultato prima delle imposte":"ante","utile ante imposte":"ante","risultato ante imposte":"ante",
  "imposte sul reddito d esercizio":"imposte","imposte":"imposte","imposte sul reddito":"imposte",
  "costo per servizi":"serv","costi per servizi":"serv",
  "roce":"roce","roce return on capital employed":"roce",
  "r o i return on investment":"roiAz","roi":"roiAz","roi return on investment":"roiAz",
  "r o s return on sales":"ros","ros":"ros","ros return on sales":"ros",
  "variazione valore della produzione":"crescita","crescita":"crescita","crescita valore produzione":"crescita"
};

export const LABELS = {company:"Azienda",piva:"Partita IVA",settore:"Settore",ateco:"Codice ATECO",anno:"Esercizio",N:"Dipendenti",nVal:"Persone valutate",inv:"Corrispettivo assessment",invAz:"Costo azioni di sviluppo",posPrev:"Posizioni in organigramma",posVac:"Posizioni vacanti",acc:"Accantonamenti",comp:"Valore competenze",gap:"GAP medio",cov:"Copertura ruoli",turn:"Turnover",ass:"Assenteismo",ric:"Ricavi operativi",vdp:"Valore della produzione",costiProd:"Costi della produzione",cp:"Costo del personale",sal:"Salari e stipendi",ebitda:"EBITDA",ebit:"EBIT",amm:"Ammortamenti",un:"Utile netto",ante:"Risultato ante imposte",imposte:"Imposte",serv:"Costo per servizi",roce:"ROCE",roiAz:"ROI aziendale",ros:"ROS",crescita:"Crescita valore produzione"};

/* voci che ci si aspetta dall'Excel del cliente (bilancio e anagrafica) */
export const EXC_KEYS = ["company","piva","settore","ateco","anno","ric","vdp","costiProd","cp","sal","amm","acc","ebitda","ebit","un","ante","imposte","serv","roce","roiAz","ros","crescita"];

/* chiavi accettate, senza duplicati, per la guida in pagina */
export function acceptedKeys(){ return Object.keys(MAP); }

export function norm(s){
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[%€().,:;'"’‘“”]/g,' ')
    .replace(/[^a-z0-9 ]/g,' ')
    .replace(/\s+/g,' ').trim();
}

/* Converte un valore di cella in numero. Il formato italiano ha la precedenza:
   «25.619.746» e «31.000» sono migliaia, «4,3» e «0,125» decimali, «1.234,56» misto.
   Restano riconosciuti i formati inglesi non ambigui («24,103,607», «1,234.56», «2.4»). */
export function toNum(v){
  if(typeof v==='number') return v;
  if(v===null||v===undefined) return NaN;
  const tok=/^[-+]?[\d.,]*\d/.exec(String(v).replace(/[€\s ]/g,'').replace(/%/g,''));
  if(!tok) return NaN;
  /* solo la parte numerica iniziale: «4,3 p.p.» → «4,3» */
  let s=tok[0].replace(/^\+/,'');
  const hasDot=s.indexOf('.')>=0, hasComma=s.indexOf(',')>=0;
  if(hasDot && hasComma){
    /* l'ultimo separatore è quello decimale */
    if(s.lastIndexOf(',')>s.lastIndexOf('.')) s=s.replace(/\./g,'').replace(',','.');
    else s=s.replace(/,/g,'');
  } else if(hasComma){
    /* virgola come separatore delle migliaia solo nei gruppi inglesi completi (24,103,607 · 4,325) */
    if(/^-?[1-9]\d{0,2}(,\d{3})+$/.test(s)) s=s.replace(/,/g,'');
    else s=s.replace(',','.');
  } else if(hasDot){
    /* punto come separatore delle migliaia nei gruppi italiani completi (25.619.746 · 31.000) */
    if(/^-?[1-9]\d{0,2}(\.\d{3})+$/.test(s)) s=s.replace(/\./g,'');
  }
  const n=parseFloat(s);
  return isFinite(n)? n : NaN;
}

/* divide una riga CSV rispettando le virgolette */
function splitCsvLine(line, sep){
  const out=[]; let cur="", q=false;
  for(let i=0;i<line.length;i++){
    const c=line[i];
    if(q){
      if(c==='"'){ if(line[i+1]==='"'){ cur+='"'; i++; } else q=false; }
      else cur+=c;
    } else if(c==='"') q=true;
    else if(c===sep){ out.push(cur.trim()); cur=""; }
    else cur+=c;
  }
  out.push(cur.trim());
  return out;
}
function countOutsideQuotes(line, sep){
  let n=0, q=false;
  for(let i=0;i<line.length;i++){ const c=line[i]; if(c==='"') q=!q; else if(!q && c===sep) n++; }
  return n;
}
/* CSV → righe. Separatore rilevato sulla prima riga non vuota: punto e virgola, virgola o tabulazione. */
export function parseCsv(text){
  text=String(text).replace(/^﻿/,'');
  const lines=text.split(/\r?\n/);
  const first=lines.find(function(l){ return l.trim()!==''; })||'';
  let sep=';', best=-1;
  [';',',','\t'].forEach(function(c){ const n=countOutsideQuotes(first,c); if(n>best){ best=n; sep=c; } });
  return lines.map(function(l){ return splitCsvLine(l,sep); });
}

/* Applica le righe allo stato s (che viene modificato).
   Per ogni riga cerca una chiave riconosciuta e prende il primo valore numerico alla sua destra. */
export function applyRows(rows, s){
  let hits=0;
  const seen={}, accKeys={};
  rows.forEach(function(r){
    if(!r||r.length<2) return;
    for(let i=0;i<r.length-1;i++){
      const key=norm(r[i]==null?"":r[i]); if(!key) continue;
      const tgt=MAP[key]; if(!tgt) continue;
      if(tgt==='acc'){ if(accKeys[key]) continue; } else if(seen[tgt]) continue;
      let found=false;
      for(let j=i+1;j<r.length;j++){
        const raw=r[j];
        if(raw===null||raw===undefined||String(raw).trim()==='') continue;
        if(tgt==='company' || tgt==='settore' || tgt==='ateco'){ s[tgt]=String(raw).trim(); found=true; break; }
        if(tgt==='piva'){ s.piva=normPiva(raw); found=true; break; }
        const n=toNum(raw);
        if(isFinite(n)){
          if(tgt==='acc'){ s.acc=(seen.acc? (+s.acc||0) : 0)+n; accKeys[key]=1; }
          else s[tgt]=n;
          found=true; break;
        }
        /* cella non numerica (es. codice «B9» o nota): si prosegue verso destra */
      }
      if(found){ seen[tgt]=1; hits++; break; }
    }
  });
  /* esercizio dall'intestazione di colonna (es. 31/12/2025) se il file non ha la chiave «Esercizio» */
  if(!seen.anno){
    outer: for(let a=0;a<rows.length;a++){ const rr=rows[a]; if(!rr) continue;
      for(let b=0;b<rr.length;b++){ const mt=/^\s*\d{1,2}[\/.\-]\d{1,2}[\/.\-](\d{4})\s*$/.exec(String(rr[b]==null?"":rr[b]));
        if(mt){ s.anno=+mt[1]; seen.anno=1; hits++; break outer; } } }
  }
  return {hits:hits, seen:seen};
}

/* Template chiave;valore da incollare in Excel */
export const TEMPLATE_ROWS = [
  ["Azienda","GAROFOLI S.p.A."],["Partita IVA",""],["Settore",""],["Codice ATECO",""],["Esercizio","2025"],["Dipendenti","169"],["Persone valutate","169"],["Corrispettivo assessment","31000"],["Costo azioni di sviluppo","0"],["Posizioni in organigramma",""],
  ["Valore competenze","78"],["GAP medio vs atteso","4,3"],["Copertura ruoli","83"],["Turnover","2,4"],["Assenteismo e malattia","3,5"],
  ["Ricavi operativi","24103607"],["Valore della produzione","25619746"],["Totale costi della produzione","20257407"],
  ["Costo del personale","7179874"],["Salari e stipendi","5111582"],["EBITDA","7016793"],["EBIT","5362339"],
  ["Ammortamenti","1554454"],["Accantonamenti","100000"],["Utile netto","3630538"],["Risultato ante imposte","4938350"],["Imposte","1307812"],
  ["Costo per servizi","3574755"],["ROCE","30,29"],["ROI","19,10"],["ROS","20,93"],["Crescita valore produzione","21,25"]
];
export function templateCsv(){ return "chiave;valore\n"+TEMPLATE_ROWS.map(function(r){return r[0]+";"+r[1];}).join("\n"); }
