/* «Salva copia» (.html autonomo), «Salva per email» (.zip) e «Salva dati» (.json). */
import { store } from "./store.js";
import { $, saveStatus } from "./dom.js";
import { baseName } from "../core/format.js";
import { zipParts } from "../core/zip.js";

const INFRAME=(function(){try{return window.self!==window.top;}catch(e){return true;}})();
let DL=null;   /* API di download dell'host, se la pagina gira dentro claude.ai */

function noteSave(){
  const ifn=$('iframeNote'); if(!ifn) return;
  if(DL || !INFRAME){ ifn.hidden=true; return; }
  ifn.hidden=false;
  ifn.innerHTML="<strong>Stai usando la dashboard dentro la pagina di Claude e il salvataggio diretto non è disponibile in questa vista.</strong> Apri il file <span class='num'>.html</span> dal tuo computer, con un doppio clic, e i tre pulsanti funzioneranno.";
}

function download(blob,name){
  if(DL && DL.save){
    saveStatus("Preparazione di "+name+"…","var(--ink-2)");
    DL.save({filename:name,data:blob}).then(function(){
      saveStatus("Salvato: "+name,"var(--good)");
    },function(err){
      const c=(err&&err.code)||"";
      if(c==="declined") saveStatus("Salvataggio annullato.","var(--ink-2)");
      else if(c==="rate_limited") saveStatus("Un salvataggio è già in corso. Attendi un momento e riprova.","var(--warn)");
      else saveStatus("Salvataggio non riuscito ("+(c||"errore")+"). Apri il file .html dal tuo computer e riprova.","var(--warn)");
    });
    return true;
  }
  try{
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){URL.revokeObjectURL(url);},4000);
    if(INFRAME){ saveStatus("Il salvataggio diretto non è disponibile in questa vista. Apri il file .html dal tuo computer e riprova.","var(--warn)"); return false; }
    saveStatus("Salvato: "+name,"var(--good)"); return true;
  }catch(err){ saveStatus("Salvataggio non riuscito: "+err.message,"var(--bad)"); return false; }
}

/* JSON sicuro dentro un <script>: nessun «</script>» o «<!--» può chiudere il blocco */
export function embedJson(obj){ return JSON.stringify(obj,null,2).replace(/</g,'\\u003c'); }

/* La copia salvata parte dall'HTML originale della pagina (prima di qualsiasi render)
   con i dati correnti nel blocco #sv-data: niente popover aperti, schede stampate o duplicati. */
export function currentHTML(){
  const doc=new DOMParser().parseFromString(store.pristine,'text/html');
  const data=doc.getElementById('sv-data');
  data.textContent=embedJson(store.S);
  absolutizeAssets(doc);
  return "<!doctype html>\n"+doc.documentElement.outerHTML;
}

/* Sul sito pubblicato (GitHub Pages) la pagina carica ./src/…: nella copia salvata quei percorsi
   diventano indirizzi completi del sito, altrimenti aperta dal disco sarebbe una pagina vuota.
   La versione compilata (dist/) è già autonoma e non ha percorsi relativi. */
export function absolutizeAssets(doc, baseUrl){
  const base=baseUrl||location.href;
  if(!/^https?:/.test(base)) return;
  doc.querySelectorAll('link[href],script[src],img[src]').forEach(function(el){
    const attr=el.hasAttribute('href')? 'href' : 'src';
    const v=el.getAttribute(attr);
    if(!v || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(v)) return;   /* già assoluto, data: o ancora */
    el.setAttribute(attr, new URL(v, base).href);
  });
}

export function initSave(){
  try{
    if(window.claude && typeof window.claude.use==='function'){
      window.claude.use("downloads").then(function(d){ DL=d||null; noteSave(); },function(){ noteSave(); });
      setTimeout(noteSave,11000);
    } else { noteSave(); }
  }catch(e){ noteSave(); }

  $('saveHtml').addEventListener('click',function(){
    download(new Blob([currentHTML()],{type:'text/html;charset=utf-8'}), baseName(store.S)+".html");
  });
  $('saveJson').addEventListener('click',function(){
    download(new Blob([JSON.stringify(store.S,null,2)],{type:'application/json'}), baseName(store.S)+".json");
  });
  $('saveZip').addEventListener('click',function(){
    const n=baseName(store.S);
    download(new Blob(zipParts(n+".html", currentHTML()),{type:'application/zip'}), n+".zip");
  });
}
