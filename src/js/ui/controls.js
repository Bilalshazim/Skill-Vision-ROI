/* Schede, campi di input, scenari, tema, stampa e pulsanti dell'intestazione. */
import { store } from "./store.js";
import { $ } from "./dom.js";
import { SCEN, SCEN_KEYS } from "../core/scenarios.js";
import { render } from "./render.js";
import { closePop, renderGlossary } from "./popover.js";
import { resetToInitial, clearAll } from "./actions.js";
import { initTabIndicator, moveTabIndicator, switchPanel, stopTransitions } from "./motion.js";

function showTab(name){
  document.querySelectorAll('section.panel').forEach(function(p){p.hidden = p.id!=="p-"+name;});
}
function selectedTab(){
  const b=document.querySelector('nav.tabs button[aria-selected="true"]');
  return b? b.dataset.tab : "sintesi";
}

function initTabs(){
  initTabIndicator(document.querySelector('nav.tabs'));
  const panels=[...document.querySelectorAll('section.panel')];
  document.querySelectorAll('nav.tabs button').forEach(function(b){
    b.addEventListener('click',function(){
      if(b.getAttribute('aria-selected')==='true') return;
      document.querySelectorAll('nav.tabs button').forEach(function(x){x.setAttribute('aria-selected', x===b?'true':'false');});
      moveTabIndicator(true);
      if(b.dataset.tab==='glossario') renderGlossary();
      closePop();
      switchPanel(panels, $("p-"+b.dataset.tab), function(){ window.scrollTo({top:0,behavior:'instant'}); });
    });
  });
  $('glossBtn').addEventListener('click',function(){
    const b=document.querySelector('nav.tabs button[data-tab="glossario"]'); if(b) b.click();
  });
  $('glOpen').addEventListener('click',function(){document.querySelectorAll('.gl-sec').forEach(function(d){d.open=true;});});
  $('glClose').addEventListener('click',function(){document.querySelectorAll('.gl-sec').forEach(function(d){d.open=false;});});
}

function initInputs(){
  document.addEventListener('input',function(e){
    const t=e.target, S=store.S;
    if(t.dataset && t.dataset.k){
      /* campo svuotato = zero; input numerico incompleto (es. «-») = si attende */
      if(t.validity && t.validity.badInput) return;
      const raw=String(t.value).trim();
      const v= raw===''? 0 : parseFloat(raw.replace(',','.'));
      if(isFinite(v)) S[t.dataset.k]=v;
      render();
    }
    else if(t.dataset && t.dataset.str){ S[t.dataset.str]=t.value; render(); }
    else if(t.id && t.id.indexOf('s_')===0 && t.type!=='checkbox'){
      const k=t.id.slice(2);
      if(k==='gg'){ S.gg=parseFloat(t.value)||0; } else { S[k]=parseFloat(t.value); }
      render();
    }
  });
  document.addEventListener('change',function(e){
    const t=e.target, S=store.S;
    if(t.id==='i_base'){ S.base=t.value; render(); }
    if(t.id==='i_conv'){ S.conv=t.value; render(); }
    if(t.id==='s_l4on'){ S.l4on=+t.value; render(); }
    if(t.dataset && t.dataset.cal){ S.cal=S.cal||{}; S.cal[t.dataset.cal]=t.checked?1:0; render(); }
  });
  $('segScen').addEventListener('click',function(e){
    const b=e.target.closest? e.target.closest('button[data-scen]') : null;
    if(!b||b.dataset.scen==='cust') return;
    const x=SCEN.filter(function(z){return z.id===b.dataset.scen;})[0]; if(!x) return;
    SCEN_KEYS.forEach(function(k){ store.S[k]=x[k]; });
    render();
  });
}

function initTheme(){
  $('themeBtn').addEventListener('click',function(){
    const r=document.documentElement;
    const cur=r.getAttribute('data-theme');
    const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const next = cur? (cur==='dark'?'light':'dark') : (sysDark?'light':'dark');
    r.setAttribute('data-theme',next);
    try{localStorage.setItem('sv-theme',next);}catch(err){}
  });
  try{const savedT=localStorage.getItem('sv-theme'); if(savedT) document.documentElement.setAttribute('data-theme',savedT);}catch(err){}
}

/* Stampa / PDF: il documento contiene tutte le schede del business case (il CSS esclude
   glossario e strumenti di caricamento) con le sezioni a scomparsa aperte. Vale anche per Ctrl+P. */
let printing=null;
function preparePrint(){
  if(printing) return;
  stopTransitions();
  closePop();
  const closed=[...document.querySelectorAll('section.panel details:not([open])')];
  closed.forEach(function(d){ d.open=true; });
  document.querySelectorAll('section.panel').forEach(function(p){p.hidden=false;});
  /* pagina 1 del PDF: solo KPI principali, catena, grafici e solidità; il resto apre la pagina 2 */
  const rest=$('p1Rest'), moved=[];
  ['kpiRow2','cfoLine'].forEach(function(id){
    const el=$(id); if(!el||!rest) return;
    const mark=document.createComment(id); el.before(mark); rest.appendChild(el); moved.push([el,mark]);
  });
  printing={closed:closed, moved:moved};
}
function restoreAfterPrint(){
  if(!printing) return;
  printing.moved.forEach(function(x){ x[1].replaceWith(x[0]); });
  printing.closed.forEach(function(d){ d.open=false; });
  printing=null;
  showTab(selectedTab());
}
function initPrint(){
  $('printBtn').addEventListener('click',function(){
    preparePrint();
    setTimeout(function(){window.print();},60);
  });
  window.addEventListener('beforeprint',preparePrint);
  window.addEventListener('afterprint',restoreAfterPrint);
}

/* colori per origine del dato: verde = Excel, ambra = da compilare noi, grigio = calcolato */
function tagFieldOrigins(){
  function tag(ids,cls){ ids.forEach(function(id){ const el=$(id); if(!el) return; const f=el.closest('.field'); if(f) f.classList.add(cls); }); }
  tag(["i_company","i_piva","i_settore","i_ateco","i_anno","i_ric","i_vdp","i_costiProd","i_cp","i_sal","i_amm","i_acc","i_serv","i_ebitda","i_ebit","i_un","i_ante","i_imp","i_roce","i_roi_az","i_ros","i_crescita"],"exc");
  tag(["i_N","i_nVal","i_inv","i_invAz","i_comp","i_gap","i_cov","i_posPrev","i_turn","i_ass","i_base","i_conv","s_el","s_r1","s_cs","s_r2","s_qa","s_r3","s_l4on","i_posVac","s_gg","s_r4"],"man");
  tag(["o_atteso","o_usc","o_scop","o_mgg","o_pop","o_ebit","o_ebitda"],"calc");
}

export function initControls(){
  initTabs();
  initInputs();
  initTheme();
  initPrint();
  tagFieldOrigins();
  $('resetBtn').addEventListener('click',resetToInitial);
  $('clearBtn').addEventListener('click',clearAll);
  $('clearBtn2').addEventListener('click',clearAll);
  $('i_base').value=store.S.base;
}
