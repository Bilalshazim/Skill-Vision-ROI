/* Sostituzione dell'intero stato (campione, azzeramento, file .json). */
import { store } from "./store.js";
import { $, setStatus, saveStatus, goTab } from "./dom.js";
import { EMPTY, NUMKEYS, SLIDERS, CALKEYS, migrate, normalizeState } from "../core/defaults.js";
import { render } from "./render.js";
import { closePop } from "./popover.js";

export function applyState(obj,msg,tone){
  if(document.activeElement && document.activeElement.blur) document.activeElement.blur();
  const S=store.S=normalizeState(obj);
  $('i_base').value=S.base;
  $('i_conv').value=S.conv;
  $('s_l4on').value=S.l4on;
  NUMKEYS.forEach(function(k){const e=document.querySelector('[data-k="'+k+'"]'); if(e) e.value=S[k];});
  document.querySelectorAll('[data-str]').forEach(function(e){ e.value=S[e.dataset.str]==null? "" : S[e.dataset.str]; });
  SLIDERS.forEach(function(k){const e=$("s_"+k); if(e) e.value=S[k];});
  CALKEYS.forEach(function(k){const c=$("c_"+k); if(c) c.checked=!!S.cal[k];});
  $('s_gg').value=S.gg;
  const ch=$('changes'), ms=$('missing');
  if(ch) ch.innerHTML="";
  if(ms) ms.textContent="";
  closePop();
  render();
  setStatus(msg,tone||"var(--ink-2)");
  saveStatus("");
}

export function resetToInitial(){
  const msg = store.embedded?
    "Dati salvati ripristinati"+(store.initial.company? ": "+store.initial.company : "")+"." :
    "Dati campione GAROFOLI ripristinati.";
  applyState(store.initial,msg,"var(--ink-2)");
}

export function clearAll(){
  store.lastFile=null; store.lastSeen={};
  applyState(EMPTY,"Tutti i dati azzerati. Carica un file oppure inserisci i valori a mano.","var(--warn)");
  goTab("dati");
}

/* un file di dati descrive un solo cliente: le voci assenti partono da zero, mai dal campione */
export function loadJsonState(obj,fileName){
  /* migrate prima della fusione: dopo, «el» arriverebbe sempre da EMPTY e un file v3 non verrebbe convertito */
  applyState(Object.assign({},EMPTY,{company:""},migrate(obj)),"Dati caricati da "+fileName+".","var(--good)");
}
