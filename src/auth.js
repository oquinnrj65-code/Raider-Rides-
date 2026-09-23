import { api } from "./api.js";
import { shell, card, esc, toast } from "./ui.js";
export function getAuth(){try{return JSON.parse(localStorage.getItem("raiderRidesAuth")||"null")}catch{return null}}
export function setAuth(x){localStorage.setItem("raiderRidesAuth",JSON.stringify(x));localStorage.setItem("raiderRidesToken",x.token)}
export function clearAuth(){localStorage.removeItem("raiderRidesAuth");localStorage.removeItem("raiderRidesToken")}
export async function authScreen(role,render){
 const app=document.querySelector("#app");
 app.innerHTML=shell(role==="driver"?"Driver login":"Rider login",role,
   card("Raider Rides account",'<form id="authForm" class="form"><label>Email<input id="authEmail" type="email" autocomplete="email" required></label><label>Password<input id="authPassword" type="password" minlength="8" autocomplete="current-password" required></label><label id="nameWrap" class="hidden">Name<input id="authName" autocomplete="name"></label><label id="inviteWrap" class="hidden">Team invite code<input id="inviteToken" autocomplete="off"></label><button id="authSubmit" class="primary" type="submit">Sign in</button></form><button id="toggleAuth" class="secondary" type="button">Create account</button><div id="authMessage" class="gps-status"></div>')
 );
 let register=false;
 const form=document.querySelector("#authForm"),toggle=document.querySelector("#toggleAuth"),submit=document.querySelector("#authSubmit"),nameWrap=document.querySelector("#nameWrap"),inviteWrap=document.querySelector("#inviteWrap");
 toggle.onclick=()=>{register=!register;nameWrap.classList.toggle("hidden",!register);inviteWrap.classList.toggle("hidden",!register||role!=="admin");submit.textContent=register?"Create account":"Sign in";toggle.textContent=register?"I already have an account":"Create account"};
 form.onsubmit=async e=>{e.preventDefault();const msg=document.querySelector("#authMessage");submit.disabled=true;try{const x=register?await api.auth.register({name:document.querySelector("#authName").value,email:document.querySelector("#authEmail").value,password:document.querySelector("#authPassword").value,role,inviteToken:document.querySelector("#inviteToken")?.value.trim()}):await api.auth.login({email:document.querySelector("#authEmail").value,password:document.querySelector("#authPassword").value,role});if(x.user.role!==role)throw Error("This account is for "+x.user.role+" access.");setAuth(x);await render()}catch(err){msg.textContent=err.message;toast(err.message)}finally{submit.disabled=false}};
}
