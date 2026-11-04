/* Accesso lato client: barriera d'uso, non protezione dei file (il sito è statico e pubblico). */
const USERNAME="Roberto";
const PASSWORD_HASH="cc784828582090330120b63bdad86f3e203b4d5897dedb4a4b1e6fb3ae9ea643";
const SESSION_KEY="sv-session";

function sha256(text){
  return crypto.subtle.digest("SHA-256",new TextEncoder().encode(text)).then(function(buf){
    return Array.from(new Uint8Array(buf)).map(function(b){ return b.toString(16).padStart(2,"0"); }).join("");
  });
}

/* versione compilata, file aperto dal disco o copia salvata: nessun login */
export function authExempt(){
  if(globalThis.SV_STANDALONE) return true;
  if(!/^https?:/.test(location.protocol)) return true;
  const el=document.getElementById('sv-data');
  return !!(el && el.textContent.trim());
}

export function hasSession(){
  try{ return sessionStorage.getItem(SESSION_KEY)==="1"; }catch(err){ return false; }
}

/* true se le credenziali sono corrette; la sessione dura finché resta aperta la scheda */
export function signIn(username,password){
  return sha256("sv-roi-login:"+username+":"+password).then(function(hash){
    if(username!==USERNAME || hash!==PASSWORD_HASH) return false;
    sessionStorage.setItem(SESSION_KEY,"1");
    return true;
  });
}

export function signOut(){
  try{ sessionStorage.removeItem(SESSION_KEY); }catch(err){}
}
