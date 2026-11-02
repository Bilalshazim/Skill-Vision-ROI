/* Animazioni dell'interfaccia: indicatore scorrevole delle schede e cambio di vista.
   Solo transform e opacity; con «riduci movimento» o senza Web Animations API i cambi sono istantanei. */
import { SNAPPY_TAB_SPRING, FAST_PAGE_VARIANTS, springEasing, cubicBezier, frame } from "../core/motion.js";

function reducedMotion(){ return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
function canAnimate(el){ return typeof el.animate==='function' && !reducedMotion(); }

/* ---------------- indicatore delle schede ---------------- */
let nav=null, ink=null;

/* posiziona l'indicatore sotto la scheda selezionata; animate=false per init, resize e caricamento font */
export function moveTabIndicator(animate){
  if(!nav||!ink) return;
  const b=nav.querySelector('button[aria-selected="true"]');
  if(!b) return;
  if(!animate) nav.classList.add('no-anim');
  ink.style.transform="translateX("+b.offsetLeft+"px) scaleX("+b.offsetWidth+")";
  if(!animate){ void ink.offsetWidth; nav.classList.remove('no-anim'); }
}

export function initTabIndicator(navEl){
  nav=navEl;
  const sp=springEasing(SNAPPY_TAB_SPRING);
  const css=window.CSS && CSS.supports && CSS.supports('transition-timing-function', sp.easing);
  nav.style.setProperty('--spring-dur', sp.duration+'ms');
  nav.style.setProperty('--spring-ease', css? sp.easing : cubicBezier(FAST_PAGE_VARIANTS.animate.transition.ease));
  /* larghezza riservata al grassetto: la scheda selezionata non sposta le altre */
  nav.querySelectorAll('button').forEach(function(b){ b.dataset.label=b.textContent.trim(); });
  ink=document.createElement('span'); ink.className='tab-ink'; ink.setAttribute('aria-hidden','true');
  nav.appendChild(ink);
  nav.classList.add('has-ink');
  moveTabIndicator(false);
  window.addEventListener('resize',function(){ moveTabIndicator(false); });
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ moveTabIndicator(false); });
}

/* ---------------- cambio di vista ---------------- */
let token=0, running=[];

/* interrompe una transizione in corso (nuovo clic, stampa) */
export function stopTransitions(){
  running.forEach(function(a){ a.cancel(); });
  running=[];
}

/* Uscita del pannello visibile (120ms), poi entrata del nuovo (160ms), come AnimatePresence mode="wait".
   Durante la transizione il contenitore conserva la sua altezza: niente salti di layout. */
export function switchPanel(panels, to, onShown){
  const id=++token;
  stopTransitions();
  const from=panels.filter(function(p){ return !p.hidden && p!==to; })[0];
  const box=to.parentElement;
  function show(){
    panels.forEach(function(p){ p.hidden = p!==to; });
    if(onShown) onShown();
  }
  function release(){ if(id===token) box.style.minHeight=""; }

  if(!from || !canAnimate(to)){ show(); release(); return; }

  box.style.minHeight=box.offsetHeight+"px";
  const ex=FAST_PAGE_VARIANTS.exit, en=FAST_PAGE_VARIANTS.animate;
  const out=from.animate([frame(en), frame(ex)], {duration:ex.transition.duration*1000, easing:cubicBezier(ex.transition.ease), fill:'forwards'});
  running=[out];
  guard(out, id);
  out.onfinish=function(){
    if(id!==token) return;
    show();
    out.cancel();   /* toglie lo stato finale dal pannello ormai nascosto */
    const inn=to.animate([frame(FAST_PAGE_VARIANTS.initial), frame(en)], {duration:en.transition.duration*1000, easing:cubicBezier(en.transition.ease)});
    running=[inn];
    guard(inn, id);
    inn.onfinish=release;
    inn.oncancel=release;
  };
}

/* Se il browser sospende i fotogrammi (finestra coperta, webview limitate, anteprima di stampa)
   l'animazione non avanza: il cambio di vista non deve dipenderne. Poco dopo la durata prevista
   la si porta comunque alla fine, così il pannello giusto è sempre visibile e opaco. */
function guard(anim, id){
  const ms=anim.effect && anim.effect.getTiming? (+anim.effect.getTiming().duration||0) : 0;
  setTimeout(function(){
    if(id===token && anim.playState==='running') anim.finish();
  }, ms+150);
}
