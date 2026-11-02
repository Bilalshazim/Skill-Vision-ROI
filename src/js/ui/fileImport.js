/* Caricamento di Excel/CSV/JSON, «AGGIORNA IL DATO» e template. */
import { store } from "./store.js";
import { $, setStatus, toast, goTab } from "./dom.js";
import { clone } from "../core/defaults.js";
import { applyRows, parseCsv, LABELS, EXC_KEYS, acceptedKeys, templateCsv } from "../core/importer.js";
import { esc } from "../core/format.js";
import { render } from "./render.js";
import { loadJsonState } from "./actions.js";

const XLSX_FALLBACK='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';

function fmtV(v){ return (typeof v==='number')? v.toLocaleString('it-IT',{maximumFractionDigits:2}) : String(v); }

/* la libreria SheetJS arriva dalla CDN; se manca si riprova da un secondo indirizzo */
function ensureXLSX(cb){
  if(typeof XLSX!=='undefined') return cb(true);
  const sc=document.createElement('script');
  sc.src=XLSX_FALLBACK;
  sc.onload=function(){cb(typeof XLSX!=='undefined');};
  sc.onerror=function(){cb(false);};
  document.head.appendChild(sc);
}

function showChanges(before){
  const S=store.S, box=$('changes'), miss=$('missing');
  const rows=[];
  Object.keys(LABELS).forEach(function(k){
    if(!store.lastSeen[k]) return;
    if(String(before[k])!==String(S[k])) rows.push([LABELS[k],fmtV(before[k]),fmtV(S[k])]);
  });
  if(rows.length){
    box.innerHTML="<strong>Valori aggiornati ("+rows.length+"):</strong><table><thead><tr><th>Voce</th><th>Prima</th><th>Ora</th></tr></thead><tbody>"+
      rows.map(function(r){return "<tr><td>"+r[0]+"</td><td class='n'>"+esc(r[1])+"</td><td class='n'>"+esc(r[2])+"</td></tr>";}).join("")+"</tbody></table>";
  } else {
    box.innerHTML="<strong>Nessuna differenza rispetto ai dati già caricati.</strong> Il file contiene gli stessi valori: se hai modificato l'Excel, salvalo e premi di nuovo AGGIORNA IL DATO.";
  }
  const m=EXC_KEYS.filter(function(k){return !store.lastSeen[k];}).map(function(k){return LABELS[k];});
  miss.textContent = m.length? "Voci non trovate nel file (restano al valore precedente): "+m.join(", ")+"." : "";
  return rows.length;
}

/* applica le righe lette dal file allo stato corrente e aggiorna la dashboard */
export function importRows(rows,fileName){
  const before=clone(store.S);
  const res=applyRows(rows,store.S);
  store.lastSeen=res.seen;
  if(res.hits===0){ setStatus("Nessuna voce riconosciuta nel file. Controlla le chiavi accettate qui sotto.","var(--warn)"); return 0; }
  $('i_base').value=store.S.base;
  render();
  const n=showChanges(before);
  setStatus(res.hits+" voci riconosciute da "+fileName+" · aggiornato alle "+new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit',second:'2-digit'})+". Verifica il controllo di coerenza qui sotto.","var(--good)");
  toast(n? ("Dati aggiornati: "+n+(n===1?" voce modificata":" voci modificate")) : "Dati riletti: nessuna differenza");
  return res.hits;
}

function pickFile(){ const inp=$('file'); inp.value=''; inp.click(); }

export function handleFile(f){
  if(!f) return;
  store.lastFile=f;
  const ext=(f.name.split('.').pop()||'').toLowerCase();
  const rd=new FileReader();
  rd.onerror=function(){
    setStatus("Non riesco a rileggere \""+f.name+"\": il file è stato modificato o spostato dopo la selezione. Selezionalo di nuovo.","var(--warn)");
    toast("Riseleziona il file aggiornato");
    pickFile();
  };
  rd.onload=function(ev){
    try{
      if(ext==='csv'){
        importRows(parseCsv(ev.target.result),f.name);
      } else {
        ensureXLSX(function(ok){
          if(!ok){ setStatus("Il lettore Excel non si è caricato (rete assente o bloccata). Salva il file come CSV e ricaricalo.","var(--warn)"); return; }
          try{
            const wb=XLSX.read(new Uint8Array(ev.target.result),{type:'array'});
            let rows=[];
            wb.SheetNames.forEach(function(nm){
              rows=rows.concat(XLSX.utils.sheet_to_json(wb.Sheets[nm],{header:1,raw:true,defval:null}));
            });
            importRows(rows,f.name);
          }catch(err2){ setStatus("Errore nella lettura del file: "+err2.message,"var(--bad)"); }
        });
      }
    }catch(err){
      setStatus("Errore nella lettura del file: "+err.message,"var(--bad)");
    }
  };
  if(ext==='csv') rd.readAsText(f,'utf-8'); else rd.readAsArrayBuffer(f);
}

/* «AGGIORNA IL DATO»: rilegge l'ultimo file, o chiede di sceglierne uno */
function doUpdate(){
  if(store.lastFile){ setStatus("Rilettura di "+store.lastFile.name+"…","var(--ink-2)"); handleFile(store.lastFile); return; }
  goTab("dati");
  toast("Nessun file caricato: scegli l'Excel da leggere");
  pickFile();
}

function copyTemplate(){
  const text=templateCsv();
  const ok=function(){setStatus("Template copiato negli appunti. Incollalo in Excel, sostituisci i valori e ricarica il file.","var(--good)");};
  function fallback(){
    const ta=document.createElement('textarea'); ta.value=text;
    ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select();
    try{document.execCommand('copy'); ok();}catch(e){setStatus("Copia non riuscita. Le chiavi sono elencate qui sotto.","var(--warn)");}
    document.body.removeChild(ta);
  }
  if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(ok,fallback); }
  else fallback();
}

export function initFileImport(){
  $('pickBtn').addEventListener('click',pickFile);
  $('file').addEventListener('change',function(e){ handleFile(e.target.files[0]); });
  $('updBtn').addEventListener('click',doUpdate);
  $('updBtnTop').addEventListener('click',doUpdate);
  $('tplBtn').addEventListener('click',copyTemplate);

  const drop=$('drop');
  ['dragenter','dragover'].forEach(function(t){drop.addEventListener(t,function(e){e.preventDefault();drop.classList.add('over');});});
  ['dragleave','drop'].forEach(function(t){drop.addEventListener(t,function(e){e.preventDefault();drop.classList.remove('over');});});
  drop.addEventListener('drop',function(e){ if(e.dataTransfer.files&&e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });

  $('jsonBtn').addEventListener('click',function(){$('jfile').click();});
  $('jfile').addEventListener('change',function(e){
    const f=e.target.files[0]; if(!f) return;
    const rd=new FileReader();
    rd.onload=function(ev){
      let o;
      try{ o=JSON.parse(ev.target.result); }
      catch(err){ setStatus("Il file non è un .json valido: "+err.message,"var(--bad)"); return; }
      loadJsonState(o,f.name);
    };
    rd.readAsText(f,'utf-8');
    e.target.value='';
  });

  $('keyList').textContent = acceptedKeys().join(" · ");
}
