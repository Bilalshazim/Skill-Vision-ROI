/* Rendering completo della dashboard a partire dallo stato corrente. */
import { store } from "./store.js";
import { $, setTxt, setHTML } from "./dom.js";
import { NUMKEYS, SLIDERS, CALKEYS } from "../core/defaults.js";
import { model } from "../core/model.js";
import { validate, isBlocked, tolerance } from "../core/validate.js";
import { SCEN, scenOverrides, activeScen, scenName, calibCount } from "../core/scenarios.js";
import { eur, eurK, pct, num, esc, art, fin } from "../core/format.js";
import { SOURCES, VOCI } from "../content/sources.js";
import { mount, waterfall, hurdleChart, bullet, riskMini, baseCompare, scenChart, sensChart, beChart } from "./charts.js";
import { infoBtn, injectInfo } from "./popover.js";

const BASE_NAME={hcva:"HCVA",va:"Valore aggiunto",ebitda:"EBITDA",cp:"Costo del personale"};
const CAL_LABEL={el:"Elasticità del valore prodotto",r1:"Quota del divario colmata in 12 mesi",cs:"Costo di sostituzione",r2:"Riduzione relativa del turnover",qa:"Quota del costo assenze a carico azienda",r3:"Riduzione relativa delle assenze"};
const BASE_EXPL={
  hcva:"Il valore che le persone generano dopo aver remunerato tutti gli altri fattori produttivi, capitale fisso compreso. Non dipende dalla definizione di EBITDA. È la base consigliata.",
  va:"Il valore creato al netto degli acquisti esterni. Include la quota generata dal capitale fisso, quindi sovrastima il contributo delle persone.",
  ebitda:"Il margine operativo lordo. Sottostima il contributo del capitale umano, perché il costo del personale è già dedotto.",
  cp:"Quanto le persone costano, non quanto producono. È la base dei modelli semplificati: inclusa solo per confronto."
};

export function render(){
  const S=store.S;
  const m=model(S);
  const checks=validate(S,m);
  const blocked=isBlocked(checks);
  const sn=scenName(S);

  renderSummary(S,m,checks,blocked,sn);
  renderData(S,m,checks);
  renderEngine(S,m);
  renderScenarios(S,m,blocked,sn);
  renderMethod(S,m);
  injectInfo();
  syncPrintValues();
}

/* Nel PDF i controlli del form spariscono: accanto a ogni campo c'è un valore statico formattato,
   visibile solo in stampa (.pv). I cursori hanno già il valore nell'etichetta. */
function printValue(c){
  if(c.tagName==="SELECT") return c.selectedIndex>=0? c.options[c.selectedIndex].text : "—";
  const v=String(c.value).trim();
  if(v==="") return "—";
  if(c.dataset.k){ const n=parseFloat(v); return isFinite(n)? n.toLocaleString('it-IT',{maximumFractionDigits:2}) : v; }
  return v;
}
function syncPrintValues(){
  document.querySelectorAll('.field').forEach(function(f){
    const c=f.querySelector('input:not([type=checkbox]):not([type=range]):not([type=file]),select');
    if(!c) return;
    let pv=f.querySelector('.pv');
    if(!pv){ pv=document.createElement('span'); pv.className='pv'; c.insertAdjacentElement('afterend',pv); }
    pv.textContent=printValue(c);
  });
}

/* ---------------- Sintesi ---------------- */
function renderSummary(S,m,checks,blocked,sn){
  setTxt("brandSub", S.company? (S.company+" · esercizio "+S.anno) : "APEX 5D™");
  setTxt("footR", S.company? (S.company+" · bilancio "+S.anno+" · "+num(+S.N)+" dipendenti") : "nessun cliente caricato");
  setTxt("scenEyebrow", sn);
  setTxt("leadTxt", !(S.N>0)?
    "Carica il bilancio del cliente e i risultati dell'assessment nella scheda «Dati». Il motore misura l'investimento contro il valore che il capitale umano genera secondo il bilancio, non contro quanto costa." :
    "Programma APEX 5D su "+num(+S.N)+" risorse di "+S.company+", composto dall'assessment e dalle azioni di sviluppo che ne derivano. Il ritorno è stimato sul bilancio "+S.anno+", separando i benefici di costo verificabili dalla stima di produttività. Ogni ipotesi è dichiarata nella scheda «Motore di calcolo».");

  /* blocco: niente numeri se i dati non reggono */
  const bn=$("blockNote");
  if(blocked){
    bn.hidden=false;
    bn.innerHTML="<strong>Risultati sospesi.</strong> "+checks.filter(function(c){return c.l==="bad";}).map(function(c){return esc(c.t);}).join(" ");
  } else bn.hidden=true;
  function K(id,v){ setTxt(id, blocked? "—" : v); }

  K("k-roi", pct(m.roi,0));
  setTxt("k-roi-sub", blocked? "in attesa di dati validi" : eur(m.net)+" netti su "+eur(m.invTot)+" · ante imposte · "+sn);
  K("k-ben", eurK(m.benefit));
  setTxt("k-ben-sub", blocked? "—" : (m.ebitdaOK? "pari "+art("al",m.ebitdaImp)+" dell'EBITDA "+S.anno+" (pro forma)" : "EBITDA non significativo"));
  K("k-pb", !isFinite(m.payback)? "—" : (m.payback<=12? num(m.payback,1)+" mesi" : "oltre 12 mesi"));
  setTxt("k-pb-sub", blocked||!isFinite(m.payback)? "beneficio nullo: non calcolabile" : (m.payback<=12? "circa "+num(m.payback*30.4,0)+" giorni, con beneficio uniforme nell'anno" : num(m.payback,1)+" mesi: non si ripaga nel primo esercizio"));
  K("k-be", pct(m.beGap,1));
  setTxt("k-be-sub", blocked? "—" : "del potenziale lordo del divario ripaga il programma; sul beneficio atteso basta "+art("il",m.beBen,0));

  K("k-cost", eurK(m.costBen));
  setTxt("k-cost-sub", blocked? "—" : "turnover e assenze"+(m.l4active?" e vacanze":"")+" · ROI sui soli costi "+pct(m.roiCost,0));
  const kc=$("k-cost"); if(kc) kc.className="val"+(!blocked && m.roiCost<0?" warn":"");
  K("k-prod", eurK(m.l1));
  setTxt("k-prod-sub", blocked? "—" : pct(m.shareL1,0)+" del beneficio · elasticità "+pct(+S.el,0)+" × attuabilità "+pct(+S.r1,0));
  K("k-gap", eurK(m.gapVal));
  setTxt("k-gap-sub", blocked? "—" : BASE_NAME[S.base]+" "+eurK(m.base)+" × "+num(+S.gap,1)+" p.p."+(m.popF<1?" × "+pct(m.popF*100,0)+" valutati":"")+" · potenziale, non perdita in corso");
  K("k-inv", eur(m.invTot));
  setTxt("k-inv-sub", blocked? "—" : "assessment "+eur(+S.inv)+" + azioni "+(S.invAz>0? eur(+S.invAz) : "non indicate")+" · "+pct(m.invPctCp,2)+" del costo del personale");

  /* barra di stato: cliente ed esercizio, sempre; KPI solo se i dati reggono */
  setTxt("sbCompany", S.company || "Nessun cliente");
  setHTML("sbMeta", [
    S.piva? "P.IVA "+S.piva : "",
    S.ateco? "ATECO "+S.ateco+(S.settore? " · "+S.settore : "") : (S.settore||""),
    S.company? "Esercizio "+S.anno : "",
    sn
  ].filter(Boolean).map(function(t){ return "<span>"+esc(t)+"</span>"; }).join(""));
  setTxt("sbRoi", blocked? "—" : pct(m.roi,0));
  setTxt("sbBen", blocked? "—" : eurK(m.benefit));
  setTxt("sbPb", blocked||!isFinite(m.payback)? "—" : (m.payback<=12? num(m.payback,1)+" mesi" : "> 12 mesi"));
  setTxt("sbBe", blocked? "—" : pct(m.beGap,1));

  /* catena logica */
  const cal=calibCount(S);
  setHTML("chain",
    "<div><span class='st'><b>1</b>Dati verificabili</span><span class='cv'>"+(blocked?"—":eurK(m.HCVA))+"</span><span class='cd'>HCVA "+esc(S.anno||"")+": bilancio, organico, assessment</span></div>"+
    "<div><span class='st'><b>2</b>Potenziale stimato</span><span class='cv'>"+(blocked?"—":eurK(m.pool))+"</span><span class='cd'>divario, turnover, assenze"+(m.l4active?", vacanze":"")+" · valori lordi</span></div>"+
    "<div><span class='st'><b>3</b>Beneficio atteso</span><span class='cv'>"+(blocked?"—":eurK(m.benefit))+"</span><span class='cd'>"+sn+" · "+cal+" di "+CALKEYS.length+" ipotesi calibrate</span></div>"+
    "<div class='todo'><span class='st'><b>4</b>Beneficio realizzato</span><span class='cv'>da misurare</span><span class='cd'>a 12 mesi, contro la baseline del piano di verifica</span></div>");

  /* frase CFO */
  const cl=$("cfoLine");
  if(blocked){
    cl.className="note warn";
    cl.innerHTML="<strong>Nessun risultato presentabile.</strong> Completa o correggi i dati segnalati qui sopra. In alternativa premi «Dati campione» per rivedere l'esempio GAROFOLI.";
  } else {
    cl.className="note";
    cl.innerHTML="<strong>La frase da portare in direzione finanziaria.</strong> Il programma costa "+eur(m.invTot)+", pari a "+num(m.ggEbitda,1)+
      " giorni di EBITDA. Si ripaga se si realizza "+art("il",m.beBen,0)+" del beneficio atteso, oppure recuperando "+art("il",m.beGap,1)+
      " del potenziale lordo del divario. "+art("Il",100-fin(m.shareL1),0)+" del beneficio poggia su voci verificabili a consuntivo — turnover e assenze — e da solo vale un ROI "+art("del",m.roiCost,0)+
      "; il resto è una stima di produttività, che il piano di verifica misura a dodici mesi."+
      (S.invAz>0? "" : " Il costo delle azioni di sviluppo non è ancora incluso: il pareggio regge fino a "+eur(m.maxAz)+" di spesa per azioni.");
  }

  mount("waterfall", waterfall(m));
  mount("hurdle", hurdleChart(S,m));
  mount("bulletComp", bullet("Competenza media rilevata (punti)",+S.comp,m.atteso));
  mount("bulletCov", bullet("Ruoli presidiati (%)",+S.cov,null));
  const p=document.createElement("p"); p.className="derived"; p.style.fontSize="12px"; p.style.marginTop="-14px";
  p.textContent=num(m.scop,1)+" posizioni su "+num(m.posBase)+(m.posAssunta?" (organico usato come proxy delle posizioni)":" in organigramma")+" non presidiate al livello richiesto. Indicatore diagnostico, non monetizzato.";
  $("bulletCov").appendChild(p);
  mount("riskMini", riskMini(S,m));

  /* controlli e calibrazione */
  const lab={bad:["bad","Bloccante"],warn:["warn","Attenzione"],info:["neutral","Nota"],ok:["good","Verificato"]};
  setHTML("checksList", checks.map(function(c){ const L=lab[c.l]; return "<li><span class='pill "+L[0]+"'><span class='dot'></span>"+L[1]+"</span><span>"+esc(c.t)+"</span></li>"; }).join(""));
  setHTML("calibBox",
    "<p class='derived' style='font-size:12.5px;line-height:1.5;margin-bottom:12px'>"+cal+" ipotesi su "+CALKEYS.length+" confermate con dati dell'azienda. Le altre sono valori di scenario: vanno presentate come tali.</p>"+
    "<ul class='checks'>"+CALKEYS.map(function(k){ const on=S.cal&&S.cal[k]; const u=(k==="cs")?"% RAL":"%";
      return "<li><span class='pill "+(on?"good":"warn")+"'><span class='dot'></span>"+(on?"Calibrata":"Ipotesi")+"</span><span><strong style='color:var(--ink)'>"+CAL_LABEL[k]+"</strong> · "+num(+S[k])+" "+u+"</span></li>"; }).join("")+"</ul>");
}

/* ---------------- Dati ---------------- */
function renderData(S,m,checks){
  NUMKEYS.forEach(function(k){const e=document.querySelector('[data-k="'+k+'"]'); if(e && document.activeElement!==e) e.value=S[k];});
  document.querySelectorAll('[data-str]').forEach(function(e){ if(document.activeElement!==e) e.value=S[e.dataset.str]==null? "" : S[e.dataset.str]; });
  $("i_conv").value=S.conv||"gest";
  $("o_atteso").value = num(m.atteso,1);
  $("o_usc").value = num(m.usc,2);
  $("o_scop").value = num(m.scop,1)+(m.posAssunta?" (proxy)":"");
  $("o_pop").value = pct(m.popF*100,0);
  $("o_mgg").value = num(m.mgg,0);
  $("o_ebit").value = eur(m.EBIT);
  $("o_ebitda").value = eur(m.EBITDA);

  const acc = checks.filter(function(c){ return /EBIT|EBITDA|Identità/.test(c.t); });
  const coer=$("coerenza");
  const accBad = acc.some(function(c){return c.l==="warn"||c.l==="bad";});
  coer.className = accBad? "note warn" : "note good";
  coer.innerHTML = "<strong>Quadratura contabile.</strong> "+(acc.length? acc.map(function(c){return esc(c.t);}).join(" ") : "Inserisci valore e costi della produzione per verificare EBIT ed EBITDA.");

  const rows=[
    ["EBIT ricalcolato","A − B", eur(m.EBIT), "—","ebitCalc"],
    ["EBITDA ricalcolato", S.conv==="prud"? "A − B + B10" : "A − B + B10 + B12 + B13", eur(m.EBITDA), eur(m.ebitdaFte),"ebitdaCalc"],
    ["Costi esterni","A − valore aggiunto", eur(m.costiEsterni), "—","costiEsterni"],
    ["Valore aggiunto","EBITDA + B9", eur(m.VA), eur(m.vaFte),"VA"],
    ["HCVA · valore aggiunto del capitale umano","EBIT + B9", eur(m.HCVA), eur(m.hcvaFte),"HCVA"],
    ["Moltiplicatore del capitale umano","HCVA ÷ B9", num(m.hcroi,2)+"×", "—","hcroi"],
    ["Costo medio aziendale per dipendente","B9 ÷ dipendenti", "—", eur(m.cmed),"cmed"],
    ["RAL media","B9a ÷ dipendenti", "—", eur(m.ral),"ral"],
    ["Rapporto costo del personale / salari","B9 ÷ B9a", num(m.cpSal,3), "—","cpSal"],
    ["Valore della produzione per dipendente","A ÷ dipendenti", eur(+S.vdp), eur(m.vdpFte),"vdpFte"],
    ["Aliquota fiscale effettiva","Imposte ÷ ante imposte", pct(m.taxRate*100), "—","taxrate"]
  ];
  $("derivedTbl").innerHTML = rows.map(function(r){
    return "<tr><td>"+r[0]+infoBtn(r[4])+"</td><td style='text-align:left;color:var(--ink-3);font-family:var(--mono);font-size:11.5px'>"+r[1]+"</td><td class='n'>"+r[2]+"</td><td class='n'>"+r[3]+"</td></tr>";
  }).join("");
}

/* ---------------- Motore di calcolo ---------------- */
function renderEngine(S,m){
  const act=activeScen(S);
  document.querySelectorAll("#segScen button").forEach(function(b){
    const on = act? b.dataset.scen===act.id : b.dataset.scen==="cust";
    b.setAttribute("aria-pressed", on?"true":"false");
  });
  setTxt("scenDesc", act?
    ("Scenario "+act.nome.toLowerCase()+": elasticità "+act.el+"%, attuabilità "+act.r1+"% (quota effettiva del potenziale "+num(act.el*act.r1/100,0)+"%), riduzione relativa del turnover "+act.r2+"%, delle assenze "+act.r3+"%. Costo di sostituzione e quota a carico azienda non cambiano con lo scenario: sono parametri da calibrare sull'azienda.") :
    "Scenario personalizzato: almeno un'ipotesi è stata modificata a mano. I risultati in tutta la dashboard sono etichettati di conseguenza.");
  setTxt("baseExpl", BASE_EXPL[S.base]);
  mount("baseCmp", baseCompare(S,m));

  setTxt("l1amt", eur(m.l1));
  setTxt("l2amt", eur(m.l2));
  setTxt("l3amt", eur(m.l3));
  setTxt("l4amt", m.l4active? eur(m.l4) : "non attiva");
  setTxt("l1f", BASE_NAME[S.base]+" "+eurK(m.base)+" × "+num(+S.gap,1)+" p.p."+(m.popF<1?" × "+pct(m.popF*100,0)+" valutati":"")+" = "+eur(m.gapVal)+"  →  × elasticità "+pct(+S.el,0)+" × attuabilità "+pct(+S.r1,0)+" = "+eur(m.l1));
  setTxt("l2f", num(m.N)+" × "+pct(+S.turn)+" = "+num(m.usc,2)+" uscite × ("+eur(m.ral)+" × "+pct(+S.cs,0)+") = "+eur(m.turnVal)+"  →  × "+pct(+S.r2,0)+" = "+eur(m.l2));
  setTxt("l3f", eur(+S.cp)+" × "+pct(+S.ass)+" = "+eur(m.assLordo)+" × "+pct(+S.qa,0)+" a carico azienda = "+eur(m.assVal)+"  →  × "+pct(+S.r3,0)+" = "+eur(m.l3));
  SLIDERS.forEach(function(k){ setTxt("s_"+k+"v", S[k]); const e=$("s_"+k); if(e&&document.activeElement!==e) e.value=S[k]; });
  CALKEYS.forEach(function(k){ const c=$("c_"+k); if(c) c.checked=!!(S.cal&&S.cal[k]); });
  const gge=$("s_gg"); if(document.activeElement!==gge) gge.value=S.gg;
  $("s_l4on").value=S.l4on;

  const lrows=[
    ["Produttività dal divario","<span class='tier est'>stima</span>", BASE_NAME[S.base]+" "+eurK(m.base), "GAP "+num(+S.gap,1)+" p.p.", m.gapVal, pct(m.effL1*100,1), m.l1,"lever1"],
    ["Turnover evitato","<span class='tier ver'>costo</span>", "RAL media "+eur(m.ral), "Turnover "+pct(+S.turn), m.turnVal, pct(+S.r2,0), m.l2,"lever2"],
    ["Assenteismo comprimibile","<span class='tier ver'>costo</span>", "Costo personale "+eurK(+S.cp), "Assenze "+pct(+S.ass), m.assVal, pct(+S.r3,0), m.l3,"lever3"]
  ];
  if(m.l4active) lrows.push(["Posizioni vacanti","<span class='tier ver'>costo</span>", "Margine "+eur(m.mgg)+"/gg", num(+S.posVac)+" vacanti", m.covVal, pct(+S.r4,0), m.l4,"lever4"]);
  let h=lrows.map(function(r){ return "<tr><td>"+r[0]+infoBtn(r[7])+"</td><td>"+r[1]+"</td><td style='color:var(--ink-2)'>"+r[2]+"</td><td class='n'>"+r[3]+"</td><td class='n'>"+eur(r[4])+"</td><td class='n'>"+r[5]+"</td><td class='n' style='font-weight:600'>"+eur(r[6])+"</td></tr>"; }).join("");
  h+="<tr class='total'><td>Beneficio atteso</td><td></td><td></td><td></td><td class='n'>"+eur(m.pool)+"</td><td class='n'>"+pct(m.pool>0?m.benefit/m.pool*100:NaN,1)+"</td><td class='n'>"+eur(m.benefit)+"</td></tr>";
  h+="<tr><td>Investimento del programma</td><td colspan='5' style='text-align:right;color:var(--ink-2)'>assessment "+eur(+S.inv)+" + azioni "+eur(+S.invAz||0)+"</td><td class='n' style='color:var(--bad)'>−"+eur(m.invTot)+"</td></tr>";
  h+="<tr class='total'><td>Beneficio netto anno 1</td><td colspan='5' style='text-align:right;color:var(--ink-2)'>ROI "+pct(m.roi,0)+" · solo costi "+pct(m.roiCost,0)+" · dopo imposte "+eur(m.netTax)+"</td><td class='n' style='color:"+(m.net>=0?"var(--good)":"var(--bad)")+"'>"+eur(m.net)+"</td></tr>";
  setHTML("leverTbl", h);
}

/* ---------------- Scenari ---------------- */
function renderScenarios(S,m,blocked,sn){
  const act=activeScen(S);
  setHTML("scenCards", SCEN.map(function(x){
    const mm=model(S,scenOverrides(x));
    const on = act && act.id===x.id;
    return "<div class='kpi"+(on?" hero":"")+"'><span class='lab'>"+x.nome+(on?" · attivo":"")+infoBtn('scen')+"</span><span class='val'>"+(blocked?"—":pct(mm.roi,0))+
      "</span><span class='sub'>"+(blocked?"—":eur(mm.net)+" netti · solo costi "+pct(mm.roiCost,0)+" · rientro "+(mm.payback<=12?num(mm.payback,1)+" mesi":"oltre 12 mesi"))+"</span></div>";
  }).join(""));
  setHTML("scenTbl", SCEN.map(function(x){
    const mm=model(S,scenOverrides(x));
    const on = act && act.id===x.id;
    return "<tr"+(on?" class='total'":"")+"><td>"+x.nome+"</td><td class='n'>"+eur(mm.l1)+"</td><td class='n'>"+eur(mm.l2)+"</td><td class='n'>"+eur(mm.l3)+
      "</td><td class='n'>"+(mm.l4active?eur(mm.l4):"—")+"</td><td class='n'>"+eur(mm.benefit)+"</td><td class='n'>−"+eur(mm.invTot)+
      "</td><td class='n'>"+eur(mm.net)+"</td><td class='n'>"+pct(mm.roi,0)+"</td><td class='n' style='color:"+(mm.roiCost<0?"var(--bad)":"inherit")+"'>"+pct(mm.roiCost,0)+"</td><td class='n'>"+(mm.payback<=12?num(mm.payback,1)+" mesi":"oltre 12")+"</td></tr>";
  }).join(""));
  mount("scenChart", scenChart(S));
  mount("sensChart", sensChart(S));
  setTxt("sensCap","Come cambia il ROI se il divario misurato fosse diverso · "+sn);
  mount("beChart", beChart(m));
  setHTML("beNote", blocked? "<strong>Dati insufficienti.</strong>" :
    "<strong>Lettura.</strong> Il programma costa "+eur(m.invTot)+". Si ripaga se si realizza almeno "+art("il",m.beBen,0)+" del beneficio atteso nel "+sn+
    ". Guardando solo alla leva di produttività, basta recuperare "+art("il",m.beGap,1)+" del potenziale lordo del divario, contro "+art("il",m.effL1*100,1)+
    " assunto: "+num(m.effL1*100/m.beGap,1)+" volte la soglia. È l'argomento più solido, perché non chiede di credere alla stima: dichiara quanto poco basta.");

  const vr=[
    ["Divario medio di competenza", num(+S.gap,1)+" p.p.", num(m.tgtGap,2)+" p.p. (−"+pct(+S.r1,0)+")", "Nuova rilevazione APEX 5D sulla stessa popolazione e con gli stessi valori attesi."],
    ["Turnover annuo", pct(+S.turn,2), pct(m.tgtTurn,2)+" (−"+pct(+S.r2,0)+" relativo)", "Uscite da libro unico sull'organico medio, distinguendo volontarie e involontarie."],
    ["Assenteismo e malattia", pct(+S.ass,2)+" delle ore", pct(m.tgtAss,2)+" (−"+pct(+S.r3,0)+" relativo)", "Ore di assenza retribuite su ore teoriche, da elaborazione paghe, per tipologia di assenza."],
    ["HCVA per dipendente", eur(m.hcvaFte), eur(m.tgtHcvaFte)+" (+"+eur(m.l1/m.N)+")", "Bilancio dell'esercizio successivo, a parità di perimetro; da depurare da effetti prezzo e volume prima di attribuirne la variazione al programma."],
    ["Costo delle azioni di sviluppo", eur(+S.invAz||0), "consuntivo", "Fatture e costi interni imputati al programma."]
  ];
  if(m.l4active) vr.push(["Giorni di vacanza delle posizioni", num(+S.gg)+" gg", num(S.gg*(1-S.r4/100),0)+" gg (−"+pct(+S.r4,0)+")", "Data di uscita del titolare e data di ingresso del sostituto, per le sole vacanze strutturali."]);
  setHTML("verifyTbl", vr.map(function(r){ return "<tr><td><strong>"+r[0]+"</strong></td><td class='n'>"+r[1]+"</td><td class='n'>"+r[2]+"</td><td>"+r[3]+"</td></tr>"; }).join(""));
}

/* ---------------- Metodologia ---------------- */
function renderMethod(S,m){
  setHTML("hcroiNote","<strong>"+esc(S.company||"Azienda")+".</strong> Ogni euro di costo del personale è associato a "+num(m.hcroi,2)+
    " euro di HCVA ("+eur(m.hcvaFte)+" per persona contro un costo medio di "+eur(m.cmed)+"). È un rapporto di valore aggiunto sul costo del lavoro, da non confondere con il ROI del programma.");
  const tol=tolerance(S);
  function ver(ok,t){ return "<span class='pill "+(ok?"good":"warn")+"'><span class='dot'></span>"+(ok?"Verificato":"Da verificare")+"</span> "+t; }
  const isSample=String(S.company).indexOf("GAROFOLI")>=0;
  const conv=[
    ["EBIT","A − B dello schema civilistico (art. 2425 c.c., OIC 12). Comprende anche componenti accessorie: è un risultato operativo in senso convenzionale.", m.hasAB? ver(!S.ebit||Math.abs(S.ebit-m.ebitAB)<=tol, eur(m.ebitAB)+(S.ebit?" · dichiarato "+eur(+S.ebit):"")) : "—"],
    ["EBITDA","Non è una voce del c.e. civilistico: va ricostruito. Convenzione selezionata: "+(S.conv==="prud"?"<strong>prudente</strong>, A − B + B10 (accantonamenti come costi)":"<strong>gestionale</strong>, A − B + B10 + B12 + B13")+". Il trattamento degli accantonamenti è discusso in dottrina: per questo è selezionabile.", m.hasAB? ver(!S.ebitda||Math.abs(S.ebitda-m.EBITDA)<=tol, eur(m.EBITDA)+(S.ebitda?" · dichiarato "+eur(+S.ebitda):"")) : "—"],
    ["Valore aggiunto","EBITDA + costo del personale (B9). Dipende dalla convenzione sull'EBITDA.", eur(m.VA)],
    ["HCVA","EBIT + B9 = A − (B − B9). Adattamento civilistico del numeratore di Fitz-enz. Non dipende dalla convenzione sull'EBITDA.", eur(m.HCVA)+" · VA − HCVA = "+eur(m.VA-m.HCVA)],
    ["Moltiplicatore del capitale umano","HCVA ÷ B9 (HC ROI di Fitz-enz). Rapporto di efficienza, non rendimento del programma.", num(m.hcroi,3)+"×"],
    ["ROCE","EBIT ÷ (totale attivo − passività correnti), convenzione del fornitore dei dati. Importato, non ricalcolato.", pct(+S.roce,2)+(isSample?" · riscontrato: 5.362.339 ÷ (28.068.439 − 10.363.456) = 30,29%":"")],
    ["ROI aziendale","EBIT ÷ totale attivo. Rendimento operativo degli attivi, importato.", pct(+S.roiAz,2)+(isSample?" · riscontrato: 5.362.339 ÷ 28.068.439 = 19,10%":"")],
    ["ROS","EBIT ÷ valore della produzione (non ÷ ricavi operativi), convenzione del fornitore dei dati.", pct(+S.ros,2)+(S.vdp>0? " · ricalcolato "+pct(m.EBIT/S.vdp*100,2)+(S.ric>0?"; su ricavi operativi sarebbe "+pct(m.EBIT/S.ric*100,2):"") : "")],
    ["Aliquota effettiva","Imposte ÷ risultato ante imposte (IRES e IRAP insieme).", pct(m.taxRate*100,2)],
    ["Beneficio dopo imposte","Beneficio netto × (1 − aliquota). L'investimento è deducibile: il rapporto ROI resta uguale prima e dopo le imposte, cambia l'importo in euro.", eur(m.netTax)],
    ["Riduzioni percentuali","Turnover, assenze e giorni di vacanza: riduzioni relative del tasso, non in punti percentuali.", "turnover "+pct(+S.turn,2)+" → "+pct(m.tgtTurn,2)]
  ];
  setHTML("convTbl", conv.map(function(r){ return "<tr><td><strong>"+r[0]+"</strong></td><td>"+r[1]+"</td><td>"+r[2]+"</td></tr>"; }).join(""));

  const g=+S.gap;
  setHTML("gapConvTbl",
    "<tr><td>Applicato direttamente</td><td class='n'>GAP ÷ 100</td><td class='n'>"+pct(g,2)+"</td><td><span class='pill good'><span class='dot'></span>Adottata · la più prudente</span></td></tr>"+
    "<tr><td>Relativo al valore atteso</td><td class='n'>GAP ÷ atteso</td><td class='n'>"+pct(m.atteso>0?g/m.atteso*100:NaN,2)+"</td><td>Non usata</td></tr>"+
    "<tr><td>Relativo al valore rilevato</td><td class='n'>GAP ÷ rilevato</td><td class='n'>"+pct(S.comp>0?g/S.comp*100:NaN,2)+"</td><td>Non usata · sarebbe la meno prudente</td></tr>");

  /* tabelle statiche, compilate una volta sola */
  const vt=$("vociTbl"); if(vt && !vt.dataset.done){
    vt.innerHTML = VOCI.map(function(v){ const cls=v[2]==="Sì"?"good":(v[2]==="Consigliata"?"warn":"neutral");
      return "<tr><td style='font-weight:"+(v[2]==="Sì"?600:400)+"'>"+v[0]+"</td><td style='text-align:left;color:var(--ink-2);white-space:normal'>"+v[1]+"</td><td><span class='pill "+cls+"'><span class='dot'></span>"+v[2]+"</span></td></tr>"; }).join("");
    vt.dataset.done="1";
  }
  const stb=$("srcTbl"); if(stb && !stb.dataset.done){
    stb.innerHTML = SOURCES.map(function(r){ return "<tr><td><strong>"+r[0]+"</strong></td><td>"+r[1]+"</td><td>"+r[2]+"</td><td>"+r[3]+"</td><td>"+r[4]+"</td></tr>"; }).join("");
    stb.dataset.done="1";
  }
}
