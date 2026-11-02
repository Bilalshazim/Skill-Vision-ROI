/* Dataset di default, chiavi di stato e migrazione dei file salvati. */

/* Caso di esempio: GAROFOLI S.p.A., bilancio 2025 */
export const SAMPLE = {
  company:"GAROFOLI S.p.A.", piva:"", settore:"", ateco:"", anno:2025,
  N:169, nVal:169, inv:31000, invAz:0,
  comp:78, gap:4.3, cov:83, posPrev:0, turn:2.4, ass:3.5,
  ric:24103607, vdp:25619746, costiProd:20257407, cp:7179874, sal:5111582,
  amm:1554454, acc:100000, ebit:5362339, ebitda:7016793, un:3630538, ante:4938350, imposte:1307812,
  serv:3574755, roce:30.29, roiAz:19.10, ros:20.93, crescita:21.25,
  conv:"gest", base:"hcva",
  el:50, r1:70, cs:50, r2:20, qa:60, r3:15, l4on:0, posVac:0, gg:45, r4:20,
  cal:{el:0,r1:0,cs:0,r2:0,qa:0,r3:0}
};

/* Stato vuoto: tutti i dati a zero, ipotesi allo scenario base */
export const EMPTY = {
  company:"", piva:"", settore:"", ateco:"", anno:new Date().getFullYear(),
  N:0, nVal:0, inv:0, invAz:0, comp:0, gap:0, cov:0, posPrev:0, turn:0, ass:0,
  ric:0, vdp:0, costiProd:0, cp:0, sal:0,
  amm:0, acc:0, ebit:0, ebitda:0, un:0, ante:0, imposte:0,
  serv:0, roce:0, roiAz:0, ros:0, crescita:0,
  conv:"gest", base:"hcva",
  el:50, r1:70, cs:50, r2:20, qa:60, r3:15, l4on:0, posVac:0, gg:45, r4:20,
  cal:{el:0,r1:0,cs:0,r2:0,qa:0,r3:0}
};

export const NUMKEYS = ["N","nVal","inv","invAz","comp","gap","cov","posPrev","turn","ass","ric","vdp","costiProd","cp","sal","amm","acc","ebit","ebitda","un","ante","imposte","serv","roce","roiAz","ros","crescita","posVac"];
export const SLIDERS = ["el","r1","cs","r2","qa","r3","r4"];
export const CALKEYS = ["el","r1","cs","r2","qa","r3"];
/* voci anagrafiche testuali */
export const STRKEYS = ["company","piva","settore","ateco"];

export function clone(o){ return JSON.parse(JSON.stringify(o)); }

/* migrazione dei file salvati con la versione 3 (un solo cursore r1 = elasticità × attuabilità) */
export function migrate(o){
  const x = Object.assign({}, o);
  if(x.el===undefined && x.r1!==undefined){ x.el = 50; x.r1 = Math.min(100, Math.round((+x.r1||0)*2)); }
  return x;
}

/* completa un oggetto di stato con i default delle voci introdotte nella v4 */
export function complete(x){
  if(!x.cal || typeof x.cal!=="object") x.cal = {el:0,r1:0,cs:0,r2:0,qa:0,r3:0};
  if(x.nVal===undefined || x.nVal===null || x.nVal==="") x.nVal = x.N;
  ["invAz","posPrev","posVac","acc"].forEach(function(k){ if(x[k]===undefined || x[k]===null) x[k]=0; });
  STRKEYS.forEach(function(k){ if(x[k]===undefined || x[k]===null) x[k]=""; });
  if(!x.conv) x.conv = "gest";
  return x;
}

/* stato pronto all'uso a partire da un oggetto qualsiasi (campione, json, copia salvata) */
export function normalizeState(obj){ return complete(migrate(clone(obj))); }
