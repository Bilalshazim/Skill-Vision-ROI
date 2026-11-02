/* Popover informativi «i» e scheda Glossario. */
import { GLOSS, GORDER } from "../content/glossary.js";

let pop=null, popBtn=null;

function popHTML(k){
  const g=GLOSS[k]; if(!g) return "";
  let h='<button class="x" type="button" aria-label="Chiudi">&times;</button><h4>'+g.t+'</h4><p>'+g.d+'</p>';
  if(g.d2) h+='<p>'+g.d2+'</p>';
  if(g.f)  h+='<div class="f">'+g.f+'</div>';
  if(g.s)  h+='<div class="s">'+g.s+'</div>';
  return h;
}

export function closePop(){ if(!pop) return; pop.hidden=true; if(popBtn){popBtn.setAttribute('aria-expanded','false'); popBtn=null;} }

function openPop(btn){
  const k=btn.dataset.info; if(!GLOSS[k]) return;
  if(popBtn===btn){ closePop(); return; }
  closePop();
  pop.innerHTML=popHTML(k); pop.hidden=false;
  popBtn=btn; btn.setAttribute('aria-expanded','true');
  const r=btn.getBoundingClientRect();
  const pw=pop.offsetWidth, ph=pop.offsetHeight;
  let left=r.left+window.scrollX+r.width/2-pw/2;
  left=Math.max(window.scrollX+16, Math.min(left, window.scrollX+document.documentElement.clientWidth-pw-16));
  let top=r.bottom+window.scrollY+9;
  if(r.bottom+ph+20>window.innerHeight && r.top-ph-9>0) top=r.top+window.scrollY-ph-9;
  pop.style.left=left+"px"; pop.style.top=top+"px";
}

export function initPopover(){
  pop=document.createElement('div'); pop.id='pop'; pop.hidden=true; pop.setAttribute('role','dialog');
  document.body.appendChild(pop);
  document.addEventListener('click',function(e){
    const b=e.target.closest? e.target.closest('.i[data-info]') : null;
    if(b){ e.preventDefault(); e.stopPropagation(); openPop(b); return; }
    if(e.target.closest && e.target.closest('#pop')){ if(e.target.classList.contains('x')) closePop(); return; }
    closePop();
  });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') closePop(); });
  window.addEventListener('resize',closePop);
}

export function infoBtn(k){ return GLOSS[k]? '<button class="i" data-info="'+k+'" type="button" aria-expanded="false">i</button>' : ''; }

/* aggiunge il pulsante «i» a ogni campo di input che ha una voce di glossario */
export function injectInfo(){
  document.querySelectorAll('.field input[data-k],.field input[data-str]').forEach(function(inp){
    const k=inp.dataset.k||inp.dataset.str;
    const lab=inp.parentElement.querySelector('label');
    if(!lab||!GLOSS[k]||lab.querySelector('.i')) return;
    const u=lab.querySelector('.u');
    const b=document.createElement('button');
    b.className='i'; b.type='button'; b.dataset.info=k; b.setAttribute('aria-expanded','false'); b.textContent='i';
    if(u) lab.insertBefore(b,u); else lab.appendChild(b);
  });
}

export function renderGlossary(){
  const box=document.getElementById('glossBody'); if(!box||box.dataset.done) return;
  const groups={};
  Object.keys(GLOSS).forEach(function(k){ const g=GLOSS[k].g||"Altro"; (groups[g]=groups[g]||[]).push(k); });
  let html="";
  GORDER.forEach(function(g){
    if(!groups[g]) return;
    html+='<details class="gl-sec" open><summary>'+g+' <span style="color:var(--ink-3);font-weight:400;font-size:12px">· '+groups[g].length+' voci</span></summary><div class="dbody">';
    groups[g].forEach(function(k){
      const x=GLOSS[k];
      html+='<div class="gl-item"><h4>'+x.t+'</h4><p>'+x.d+'</p>';
      if(x.d2) html+='<p style="margin-top:8px">'+x.d2+'</p>';
      if(x.f)  html+='<div class="f">'+x.f+'</div>';
      if(x.s)  html+='<div class="s">'+x.s+'</div>';
      html+='</div>';
    });
    html+='</div></details>';
  });
  box.innerHTML=html; box.dataset.done="1";
}
