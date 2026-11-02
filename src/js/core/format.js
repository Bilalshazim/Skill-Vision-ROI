/* Formattazione numeri e testi in italiano. */

const nfE = new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:0});

export function eur(v){ return isFinite(v)? nfE.format(Math.round(v)) : "—"; }
export function eurK(v){ if(!isFinite(v))return "—"; const a=Math.abs(v); if(a>=1e6) return (v/1e6).toLocaleString('it-IT',{maximumFractionDigits:2})+" M€"; if(a>=1e4) return Math.round(v/1e3).toLocaleString('it-IT')+"k€"; return nfE.format(Math.round(v)); }
export function pct(v,d){ return isFinite(v)? v.toLocaleString('it-IT',{minimumFractionDigits:d===undefined?1:d,maximumFractionDigits:d===undefined?1:d})+"%" : "—"; }
export function num(v,d){ return isFinite(v)? v.toLocaleString('it-IT',{minimumFractionDigits:d||0,maximumFractionDigits:d===undefined?0:d}) : "—"; }
export function esc(t){ return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
export function fin(v){ return isFinite(v)? v : 0; }

/* articolo italiano davanti a una percentuale: l'8%, l'80%, l'11%, dell'84%, all'80% */
export function art(prep,v,d){
  const t=pct(v,d), V=/^8/.test(t) || /^1(1)?(,\d+)?%/.test(t);
  const M={il:"l'",Il:"L'",del:"dell'",al:"all'",dal:"dall'"};
  return (V? M[prep] : prep+" ")+t;
}

/* nome file sicuro dalla ragione sociale */
export function slug(x){
  return String(x||"azienda").normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^A-Za-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,48) || "azienda";
}
export function baseName(s){ return "ROI_"+slug(s.company)+"_"+(s.anno||""); }
