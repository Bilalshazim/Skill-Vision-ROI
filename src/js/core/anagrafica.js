/* Dati anagrafici: partita IVA e codice ATECO. */

/* forma canonica: senza spazi né prefisso «IT»; da Excel può arrivare come numero senza zeri iniziali */
export function normPiva(v){
  if(typeof v==='number' && isFinite(v)) return String(Math.round(v)).padStart(11,"0");
  return String(v==null?"":v).replace(/[\s.\-]/g,"").replace(/^IT/i,"");
}

/* partita IVA italiana: 11 cifre con cifra di controllo (algoritmo dell'Agenzia delle Entrate) */
export function pivaValid(v){
  const p=normPiva(v);
  if(!/^\d{11}$/.test(p)) return false;
  let sum=0;
  for(let i=0;i<10;i++){
    let d=+p[i];
    if(i%2===1){ d*=2; if(d>9) d-=9; }
    sum+=d;
  }
  return (10-sum%10)%10===+p[10];
}

/* codice ATECO: divisione a 2 cifre, poi gruppo, classe, categoria (es. 28 · 28.2 · 28.29 · 28.29.30) */
export function atecoValid(v){ return /^\d{2}(\.\d{1,2}){0,2}$/.test(String(v==null?"":v).trim()); }
