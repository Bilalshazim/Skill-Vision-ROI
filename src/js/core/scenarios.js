/* Scenari predefiniti: cambiano solo le ipotesi di effetto, mai le basi di bilancio. */
import { CALKEYS } from "./defaults.js";

export const SCEN = [
  {id:"prud", nome:"Prudenziale", el:40, r1:50, r2:15, r3:10, r4:10},
  {id:"base", nome:"Base",        el:50, r1:70, r2:20, r3:15, r4:20},
  {id:"espa", nome:"Espansivo",   el:60, r1:80, r2:25, r3:20, r4:30}
];
export const SCEN_KEYS = ["el","r1","r2","r3","r4"];

/* override da passare a model() per valutare uno scenario */
export function scenOverrides(x){ return {el:x.el, r1:x.r1, r2:x.r2, r3:x.r3, r4:x.r4}; }

export function activeScen(s){
  for(let i=0;i<SCEN.length;i++){ const x=SCEN[i];
    if(+s.el===x.el && +s.r1===x.r1 && +s.r2===x.r2 && +s.r3===x.r3 && +s.r4===x.r4) return x; }
  return null;
}
export function scenName(s){ const a=activeScen(s); return a? "scenario "+a.nome.toLowerCase() : "scenario personalizzato"; }
export function calibCount(s){ let c=0; CALKEYS.forEach(function(k){ if(s.cal && s.cal[k]) c++; }); return c; }
