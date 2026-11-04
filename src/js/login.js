/* SKILL-VISION · pagina di accesso. */
import { hasSession, signIn } from "./ui/auth.js";

try{const t=localStorage.getItem('sv-theme'); if(t) document.documentElement.setAttribute('data-theme',t);}catch(err){}

function enter(){ location.replace("./index.html"); }
if(hasSession()) enter();

const btn=document.getElementById('loginBtn');
const msg=document.getElementById('loginError');

function fail(text){
  msg.textContent=text;
  msg.hidden=false; btn.disabled=false;
}

document.getElementById('loginForm').addEventListener('submit',function(e){
  e.preventDefault();
  msg.hidden=true; btn.disabled=true;
  Promise.resolve().then(function(){
    return signIn(document.getElementById('username').value.trim(),document.getElementById('password').value);
  }).then(function(ok){
    if(ok) enter();
    else fail("Nome utente o password non corretti.");
  },function(){
    fail("Accesso non riuscito. Apri il sito in HTTPS e riprova.");
  });
});
