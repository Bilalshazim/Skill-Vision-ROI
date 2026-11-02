/* Grafici SVG disegnati a mano: nessuna libreria esterna. */
import { model } from "../core/model.js";
import { SCEN, scenOverrides, activeScen, scenName } from "../core/scenarios.js";
import { eur, eurK, pct, num, art, fin } from "../core/format.js";

/* ---------------- svg helpers ---------------- */
const NS="http://www.w3.org/2000/svg";
function el(t,a){const e=document.createElementNS(NS,t);for(const k in a){if(a[k]!==null&&a[k]!==undefined)e.setAttribute(k,a[k]);}return e;}
function txt(x,y,s,o){o=o||{};const t=el("text",{x:x,y:y,fill:o.fill||"var(--ink-2)","font-size":o.fs||11,"font-weight":o.fw||400,"text-anchor":o.ta||"start","font-family":o.mono?"var(--mono)":"var(--sans)"});t.textContent=s;return t;}
function svgRoot(w,h){return el("svg",{viewBox:"0 0 "+w+" "+h,width:"100%",role:"img"});}
let _pid=0;
function hatch(s,color){
  const id="h"+(++_pid);
  const d=el("defs",{}), p=el("pattern",{id:id,width:6,height:6,patternUnits:"userSpaceOnUse",patternTransform:"rotate(45)"});
  p.appendChild(el("rect",{width:6,height:6,fill:color,opacity:.28}));
  p.appendChild(el("rect",{width:2.4,height:6,fill:color}));
  d.appendChild(p); s.appendChild(d);
  return "url(#"+id+")";
}

export function mount(id,node){const c=document.getElementById(id);if(!c)return;c.innerHTML="";c.appendChild(node);}

/* Dal potenziale lordo al netto, leva per leva */
export function waterfall(m){
  const W=540,H=300,L=8,R=8,T=42,B=60;
  const s=svgRoot(W,H);
  const hp=hatch(s,"var(--c1)");
  const items=[
    {l:"Potenziale lordo", v:m.pool, c:"var(--ink-3)", ghost:true},
    {l:"Produttività (stima)", v:m.l1, c:hp, stroke:"var(--c1)"},
    {l:"Turnover", v:m.l2, c:"var(--c2)"},
    {l:"Assenze", v:m.l3, c:"var(--c3)"}
  ];
  if(m.l4>0) items.push({l:"Vacanze", v:m.l4, c:"var(--line-strong)"});
  items.push({l:"Investimento", v:-Math.abs(m.invTot), c:"var(--bad)"});
  items.push({l:"Netto", v:m.net, c:m.net>=0?"var(--good)":"var(--bad)", total:true});
  items.forEach(function(d){ d.v=fin(d.v); });
  const maxv=Math.max(fin(m.pool), fin(m.benefit), Math.abs(fin(m.net)), 1);
  const iw=(W-L-R)/items.length, bw=Math.min(52, iw*0.62), plotH=H-T-B;
  let run=0;
  items.forEach(function(d,i){
    const cx=L+iw*i+iw/2; let h, y;
    if(d.ghost||d.total){ h=Math.abs(d.v)/maxv*plotH; y=T+plotH-h; }
    else if(d.v<0){ const prev=run; run=run+d.v; h=Math.abs(d.v)/maxv*plotH; y=T+plotH-prev/maxv*plotH; }
    else { h=d.v/maxv*plotH; y=T+plotH-(run+d.v)/maxv*plotH; run=run+d.v; }
    if(d.ghost) run=0;
    h=Math.max(fin(h),2); y=fin(y);
    s.appendChild(el("rect",{x:cx-bw/2,y:y,width:bw,height:h,rx:4,fill:d.c,opacity:d.ghost?0.28:1,stroke:d.stroke||null,"stroke-width":d.stroke?1.5:null}));
    s.appendChild(txt(cx,y-7,(d.v<0?"−":"")+eurK(Math.abs(d.v)),{ta:"middle",fs:10.5,fw:600,mono:true,fill:"var(--ink)"}));
    d.l.split(" ").forEach(function(w,j){ s.appendChild(txt(cx,H-B+18+j*12,w,{ta:"middle",fs:10.5,fill:"var(--ink-2)"})); });
  });
  s.appendChild(el("line",{x1:L,y1:T+plotH,x2:W-R,y2:T+plotH,stroke:"var(--line-strong)","stroke-width":1}));
  s.appendChild(txt(L,13,"Potenziale lordo → quota attesa per leva → risultato netto",{fs:10.5,fill:"var(--ink-3)"}));
  return s;
}

/* Barre orizzontali con asse dello zero */
function hbars(rows,opts){
  opts=opts||{};
  const W=opts.W||540, L=opts.L||190, R=64, T=30, B=16, bh=22;
  const H=T+B+rows.length*bh+(rows.length-1)*14;
  const s=svgRoot(W,H);
  rows.forEach(function(r){ r.v=fin(r.v); });
  const mx=Math.max.apply(null,rows.map(function(r){return r.v;}).concat([1]));
  const mn=Math.min.apply(null,rows.map(function(r){return r.v;}).concat([0]));
  const w=W-L-R, x0=L+(-mn)/(mx-mn)*w;
  rows.forEach(function(r,i){
    const y=T+i*(bh+14);
    const bw=Math.abs(r.v)/(mx-mn)*w, x=r.v>=0? x0 : x0-bw;
    s.appendChild(el("rect",{x:x,y:y,width:Math.max(2,bw),height:bh,rx:4,fill:r.c}));
    s.appendChild(txt(L-10,y+bh/2+4,r.l,{ta:"end",fs:11.5,fill:"var(--ink)",fw:r.b?600:400}));
    const lx=r.v>=0? x0+bw+8 : x0+8;
    s.appendChild(txt(lx,y+bh/2+4,(opts.fmt||function(v){return pct(v,0);})(r.v),{fs:11.5,fw:600,mono:true,fill:r.v<0?"var(--bad)":"var(--ink)"}));
  });
  if(mn<0) s.appendChild(el("line",{x1:x0,y1:T-6,x2:x0,y2:H-B+4,stroke:"var(--line-strong)","stroke-width":1}));
  if(opts.cap) s.appendChild(txt(0,14,opts.cap,{fs:10.5,fill:"var(--ink-3)"}));
  return s;
}

/* ROI del programma contro gli indici di redditività aziendali */
export function hurdleChart(S,m){
  return hbars([
    {l:"Programma · tutte le leve", v:m.roi, c:"var(--accent)", b:true},
    {l:"Programma · solo costi", v:m.roiCost, c:"var(--accent-ink)", b:true},
    {l:"ROCE aziendale", v:+S.roce, c:"var(--c2)"},
    {l:"ROI aziendale", v:+S.roiAz, c:"var(--c2)"},
    {l:"ROS", v:+S.ros, c:"var(--c2)"}
  ],{cap:"Rendimento annuo, scala comune"});
}

/* Indicatore a proiettile: valore rilevato contro atteso */
export function bullet(label,val,target){
  const W=380,H=96,L=4,R=4,T=34;
  const s=svgRoot(W,H), w=W-L-R;
  s.appendChild(el("rect",{x:L,y:T,width:w,height:18,rx:4,fill:"var(--surface-3)"}));
  val=fin(val);
  s.appendChild(el("rect",{x:L,y:T,width:Math.max(3,fin(Math.min(100,val)/100*w)),height:18,rx:4,fill:"var(--c1)"}));
  if(target!==null&&target!==undefined){
    target=fin(target);
    const tx=L+Math.min(100,target)/100*w;
    s.appendChild(el("line",{x1:tx,y1:T-7,x2:tx,y2:T+25,stroke:"var(--ink)","stroke-width":2.5,"stroke-linecap":"round"}));
    s.appendChild(txt(tx,T+42,"atteso "+num(target,1),{ta:tx>w*0.75?"end":"middle",fs:10.5,fill:"var(--ink-2)",mono:true}));
    const d=val-target;
    s.appendChild(txt(L,T+42,(d<0?"−":"+")+num(Math.abs(d),1)+" p.p. vs atteso",{fs:10.5,fill:d<0?"var(--bad)":"var(--good)",fw:600,mono:true}));
  }
  s.appendChild(txt(L,20,label,{fs:11,fill:"var(--ink-3)",fw:600}));
  s.appendChild(txt(W-R,20,num(val,1),{ta:"end",fs:17,fw:600,mono:true,fill:"var(--ink)"}));
  return s;
}

/* Turnover e assenze, valori lordi */
export function riskMini(S,m){
  const W=380,H=96, s=svgRoot(W,H);
  const rows=[
    {l:"Turnover "+pct(+S.turn), sub:num(m.usc,1)+" uscite/anno · "+eurK(m.turnVal)+" di costo lordo", c:"var(--c2)", v:+S.turn},
    {l:"Assenze "+pct(+S.ass), sub:eurK(m.assVal)+" a carico azienda (quota "+pct(+S.qa,0)+")", c:"var(--c3)", v:+S.ass}
  ];
  const max=Math.max(+S.turn||0,+S.ass||0,6);
  rows.forEach(function(r,i){
    const y=10+i*46;
    s.appendChild(txt(0,y+10,r.l,{fs:12,fw:600,fill:"var(--ink)"}));
    s.appendChild(el("rect",{x:0,y:y+16,width:W,height:8,rx:4,fill:"var(--surface-3)"}));
    s.appendChild(el("rect",{x:0,y:y+16,width:Math.max(3,fin(r.v/max*W)),height:8,rx:4,fill:r.c}));
    s.appendChild(txt(0,y+38,r.sub,{fs:10.5,fill:"var(--ink-2)",mono:true}));
  });
  return s;
}

/* Lo stesso divario applicato alle quattro basi possibili */
export function baseCompare(S,m){
  const defs=[["hcva","HCVA (consigliata)"],["va","Valore aggiunto"],["ebitda","EBITDA"],["cp","Costo del personale"]];
  return hbars(defs.map(function(d){
    return {l:d[1], v:fin(Math.max(0,m.bases[d[0]])*S.gap/100*m.popF), c:S.base===d[0]?"var(--accent)":"var(--line-strong)", b:S.base===d[0]};
  }),{W:760,L:190,fmt:eurK,cap:"Potenziale lordo dello stesso divario ("+num(+S.gap,1)+" p.p.) secondo la base scelta"});
}

/* Beneficio netto nei tre scenari */
export function scenChart(S){
  const W=540,H=240,L=8,R=8,T=30,B=58;
  const res=SCEN.map(function(sc){ return {n:sc.nome, id:sc.id, m:model(S,scenOverrides(sc))}; });
  const max=Math.max.apply(null,res.map(function(r){return fin(r.m.benefit);}).concat([fin(model(S).invTot),1]));
  const s=svgRoot(W,H), iw=(W-L-R)/3, bw=Math.min(88,iw*0.5), plotH=H-T-B;
  const hp=hatch(s,"var(--c1)");
  const act=activeScen(S);
  res.forEach(function(r,i){
    const cx=L+iw*i+iw/2;
    const hc=fin(r.m.costBen/max*plotH), hl=fin(r.m.l1/max*plotH), hi=fin(r.m.invTot/max*plotH);
    s.appendChild(el("rect",{x:cx-bw/2,y:T+plotH-hc,width:bw,height:Math.max(1,hc),fill:"var(--c2)"}));
    s.appendChild(el("rect",{x:cx-bw/2,y:T+plotH-hc-hl,width:bw,height:Math.max(1,hl),fill:hp,stroke:"var(--c1)","stroke-width":1.2}));
    s.appendChild(el("line",{x1:cx-bw/2-6,y1:T+plotH-hi,x2:cx+bw/2+6,y2:T+plotH-hi,stroke:"var(--bad)","stroke-width":2,"stroke-dasharray":"4 3"}));
    s.appendChild(txt(cx,T+plotH-hc-hl-8,eurK(r.m.net),{ta:"middle",fs:11,fw:600,mono:true,fill:"var(--ink)"}));
    const on=act && act.id===r.id;
    s.appendChild(txt(cx,H-B+18,r.n+(on?" ●":""),{ta:"middle",fs:11.5,fw:600,fill:"var(--ink)"}));
    s.appendChild(txt(cx,H-B+33,"ROI "+pct(r.m.roi,0),{ta:"middle",fs:10.5,mono:true,fill:"var(--ink-2)"}));
    s.appendChild(txt(cx,H-B+47,"solo costi "+pct(r.m.roiCost,0),{ta:"middle",fs:10,mono:true,fill:r.m.roiCost<0?"var(--bad)":"var(--ink-3)"}));
  });
  s.appendChild(el("line",{x1:L,y1:T+plotH,x2:W-R,y2:T+plotH,stroke:"var(--line-strong)","stroke-width":1}));
  s.appendChild(txt(L,14,"Pieno = benefici di costo · tratteggio = stima di produttività · linea rossa = investimento · etichetta = netto",{fs:10,fill:"var(--ink-3)"}));
  return s;
}

/* ROI al variare del divario rilevato (1–10 punti) */
export function sensChart(S){
  const W=540,H=240,L=46,R=16,T=26,B=42;
  const pts=[]; for(let g=1;g<=10;g+=0.5){ pts.push({g:g, roi:model(S,{gap:g}).roi}); }
  const rc=model(S).roiCost;
  const vals=pts.map(function(p){return p.roi;}).concat(isFinite(rc)?[rc]:[]);
  const maxR=Math.max.apply(null,vals), minR=Math.min.apply(null,vals);
  const ok=isFinite(maxR)&&isFinite(minR);
  const pw=W-L-R, ph=H-T-B;
  function X(g){return L+(g-1)/9*pw;}
  function Y(r){return T+ph-(r-minR)/((maxR-minR)||1)*ph;}
  const s=svgRoot(W,H);
  [0,0.5,1].forEach(function(f){
    const yy=T+ph-f*ph, vv=ok? minR+f*(maxR-minR) : 0;
    s.appendChild(el("line",{x1:L,y1:yy,x2:W-R,y2:yy,stroke:"var(--line)","stroke-width":1}));
    s.appendChild(txt(L-8,yy+4,Math.round(vv)+"%",{ta:"end",fs:10,mono:true,fill:"var(--ink-3)"}));
  });
  if(ok){
    if(isFinite(rc)){
      s.appendChild(el("line",{x1:L,y1:Y(rc),x2:W-R,y2:Y(rc),stroke:"var(--c2)","stroke-width":2,"stroke-dasharray":"5 4"}));
      s.appendChild(txt(W-R,Y(rc)-6,"solo benefici di costo "+pct(rc,0),{ta:"end",fs:10.5,mono:true,fill:"var(--c2)",fw:600}));
    }
    const d=pts.map(function(p,i){return (i?"L":"M")+X(p.g).toFixed(1)+" "+Y(p.roi).toFixed(1);}).join(" ");
    s.appendChild(el("path",{d:d,fill:"none",stroke:"var(--c1)","stroke-width":2,"stroke-linejoin":"round","stroke-linecap":"round"}));
    const cur=model(S);
    if(isFinite(cur.roi) && +S.gap>=1 && +S.gap<=10){
      s.appendChild(el("circle",{cx:X(+S.gap),cy:Y(cur.roi),r:5,fill:"var(--c1)",stroke:"var(--surface)","stroke-width":2}));
      s.appendChild(txt(X(+S.gap),Y(cur.roi)-12,"rilevato "+num(+S.gap,1),{ta:X(+S.gap)>W*0.7?"end":"middle",fs:10.5,fw:600,mono:true,fill:"var(--ink)"}));
    }
  } else {
    s.appendChild(txt(L,T+ph/2,"Inserisci i dati per calcolare la sensibilità.",{fs:11,fill:"var(--ink-3)"}));
  }
  [1,2.5,4,5.5,7,8.5,10].forEach(function(g){ s.appendChild(txt(X(g),H-B+16,num(g,1),{ta:"middle",fs:10,mono:true,fill:"var(--ink-3)"})); });
  s.appendChild(txt(L,14,"ROI del programma al variare del divario medio rilevato · "+scenName(S),{fs:10.5,fill:"var(--ink-3)"}));
  s.appendChild(txt(W-R,H-8,"GAP in punti",{ta:"end",fs:10,fill:"var(--ink-3)"}));
  return s;
}

function gauge(s,y,w,L,f,marker,lab,flab,mlab){
  s.appendChild(txt(L,y-12,lab,{fs:11,fill:"var(--ink-3)"}));
  s.appendChild(el("rect",{x:L,y:y,width:w,height:24,rx:5,fill:"var(--surface-3)"}));
  if(!isFinite(f)){ s.appendChild(txt(L+10,y+16,"non calcolabile",{fs:11,fill:"var(--ink-3)"})); return; }
  const ff=Math.max(0.004,Math.min(1,f));
  const col=f<=1?"var(--good)":"var(--bad)";
  s.appendChild(el("rect",{x:L,y:y,width:Math.max(3,ff*w),height:24,rx:5,fill:col}));
  let tx=L+Math.max(3,ff*w)+8, anchor="start";
  if(ff>0.8){ tx=L+ff*w-8; anchor="end"; }
  s.appendChild(txt(tx,y+16,flab,{fs:11.5,fw:600,mono:true,fill:ff>0.8?"#fff":col,ta:anchor}));
  if(isFinite(marker)){
    const mx=L+Math.min(1,marker)*w;
    s.appendChild(el("line",{x1:mx,y1:y-7,x2:mx,y2:y+31,stroke:"var(--accent)","stroke-width":2.5,"stroke-linecap":"round"}));
    s.appendChild(txt(mx,y+44,mlab,{ta:mx>w*0.6?"end":"start",fs:10.5,mono:true,fill:"var(--accent)"}));
  }
}

/* Punto di pareggio sul potenziale e sul beneficio */
export function beChart(m){
  const W=760,H=190,L=4,w=W-8;
  const s=svgRoot(W,H);
  gauge(s,30,w,L,m.beGap/100,m.effL1,"Sul potenziale lordo del divario ("+eur(m.gapVal)+" = 100%)","pareggio "+pct(m.beGap,1),"quota attesa nello scenario "+pct(m.effL1*100,1));
  gauge(s,124,w,L,m.beBen/100,null,"Sul beneficio atteso nel primo anno ("+eur(m.benefit)+" = 100%)","deve realizzarsi almeno "+art("il",m.beBen,1),"");
  return s;
}
