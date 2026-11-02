/* SKILL-VISION · Human Capital ROI Engine — punto di ingresso. */
import { store } from "./ui/store.js";
import { SAMPLE, normalizeState } from "./core/defaults.js";
import { render } from "./ui/render.js";
import { initPopover, renderGlossary } from "./ui/popover.js";
import { initControls } from "./ui/controls.js";
import { initFileImport } from "./ui/fileImport.js";
import { initSave } from "./ui/save.js";

/* HTML intatto della pagina, prima di qualsiasi modifica: base per «Salva copia» */
store.pristine = document.documentElement.outerHTML;

/* dati di partenza: quelli incorporati da «Salva copia», altrimenti il campione */
function readEmbedded(){
  const el=document.getElementById('sv-data');
  const txt=el? el.textContent.trim() : "";
  if(!txt) return null;
  try{ const o=JSON.parse(txt); return (o && typeof o==="object")? o : null; }
  catch(e){ return null; }
}
const embedded=readEmbedded();
store.embedded = !!embedded;
store.initial = normalizeState(embedded || SAMPLE);
store.S = normalizeState(store.initial);

initPopover();
initControls();
initFileImport();
initSave();
render();
renderGlossary();
