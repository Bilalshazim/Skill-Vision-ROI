/* Preset di animazione (instructions.md §1), tradotti per CSS e Web Animations API.
   Si animano solo transform e opacity. */

/* Molla dell'indicatore delle schede: accelerazione immediata, nessun rimbalzo */
export const SNAPPY_TAB_SPRING = { type:'spring', stiffness:600, damping:35, mass:0.5 };

/* Cambio di vista: entrata 160ms, uscita 120ms */
export const FAST_PAGE_VARIANTS = {
  initial: { opacity:0, scale:0.985, y:4 },
  animate: { opacity:1, scale:1, y:0, transition:{ duration:0.16, ease:[0.2,0,0,1] } },
  exit:    { opacity:0, scale:0.985, y:-4, transition:{ duration:0.12, ease:[0.4,0,1,1] } }
};

export function cubicBezier(e){ return "cubic-bezier("+e.join(",")+")"; }

/* stato di una variante → transform CSS */
export function frame(v){ return { opacity:v.opacity, transform:"translateY("+v.y+"px) scale("+v.scale+")" }; }

/* Simula la molla (massa-molla-smorzatore da 0 a 1) e la campiona in una curva CSS linear().
   Restituisce la durata fino all'assestamento e la curva; il valore finale è esattamente 1. */
export function springEasing(spring, samples){
  const k=spring.stiffness, c=spring.damping, m=spring.mass;
  const dt=1/2000, n=samples||40;
  const xs=[0];
  let x=0, v=0, t=0;
  while(t<2){
    const a=(-k*(x-1)-c*v)/m;
    v+=a*dt; x+=v*dt; t+=dt;
    xs.push(x);
    if(Math.abs(1-x)<0.001 && Math.abs(v)<0.01) break;
  }
  const duration=Math.round(t*1000);
  const pts=[];
  for(let i=0;i<=n;i++){
    const idx=Math.round(i/n*(xs.length-1));
    pts.push(i===n? 1 : +xs[idx].toFixed(4));
  }
  return { duration:duration, points:pts, easing:"linear("+pts.join(", ")+")" };
}
