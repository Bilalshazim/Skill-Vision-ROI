/* Piccoli helper DOM e messaggi di stato. */

export function $(id){ return document.getElementById(id); }
export function setTxt(id,v){ const e=$(id); if(e) e.textContent=v; }
export function setHTML(id,v){ const e=$(id); if(e) e.innerHTML=v; }

export function setStatus(msg,color){ const e=$('status'); if(!e) return; e.textContent=msg; e.style.color=color||"var(--ink-2)"; }
export function saveStatus(msg,color){ const e=$('saveStatus'); if(e){e.textContent=msg; e.style.color=color||"var(--ink-2)";} }

export function toast(msg){
  let t=$('toast');
  if(!t){ t=document.createElement('div'); t.id='toast'; t.setAttribute('role','status');
    t.style.cssText="position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;background:var(--ink);color:var(--surface);padding:10px 16px;border-radius:8px;font-size:13px;box-shadow:var(--shadow-lift);max-width:min(560px,calc(100vw - 32px))";
    document.body.appendChild(t); }
  t.textContent=msg; t.style.display='block';
  clearTimeout(t._h); t._h=setTimeout(function(){t.style.display='none';},4200);
}

/* passa a una scheda simulando il clic sulla sua linguetta */
export function goTab(name){
  const b=document.querySelector('nav.tabs button[data-tab="'+name+'"]');
  if(b && b.getAttribute('aria-selected')!=='true') b.click();
}
