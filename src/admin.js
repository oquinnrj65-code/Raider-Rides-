import { api } from "./api.js"; import { shell, card, table, esc, money, toast } from "./ui.js"; import { getAuth, clearAuth, authScreen } from "./auth.js";
export async function renderAdmin(){
 const session=getAuth();
 if(!session||session.user?.role!=="admin"){return authScreen("admin",renderAdmin)}
 const app=document.querySelector("#app");
 app.innerHTML=shell("Admin","admin",
  '<button id="adminLogout" class="secondary" type="button">Sign out</button>'+
  card("Invite team member",'<p>Only an administrator can create team invitations.</p><form id="inviteForm" class="form"><label>Team member email (optional)<input id="inviteEmail" type="email" placeholder="team@example.com"></label><button class="primary" type="submit">Create invitation</button></form><div id="inviteResult" class="gps-status"></div>')+
  '<div id="stats" class="stats">Loading…</div><div class="grid">'+card("Rides",'<div id="adminRides">Loading…</div>')+card("Drivers",'<div id="drivers">Loading…</div>')+"</div>");
 document.querySelector("#adminLogout").onclick=()=>{clearAuth();renderAdmin()};
 document.querySelector("#inviteForm").onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector("button");b.disabled=true;try{const x=await api.admin.invite({email:document.querySelector("#inviteEmail").value.trim()});document.querySelector("#inviteResult").innerHTML='<strong>Invitation created.</strong><br>Send this link to the team member:<br><input value="'+esc(x.inviteUrl||"")+'" readonly onclick="this.select()"><br><small>The invitation can be used once.</small>'}catch(err){toast(err.message)}finally{b.disabled=false}};
 try{
  const[s,r,d]=await Promise.all([api.admin.stats(),api.admin.rides(),api.admin.drivers()]);
  document.querySelector('#stats').innerHTML=[["Active rides",s.activeRides],["Online drivers",s.driversOnline],["Rides today",s.ridesToday],["Revenue",money(s.revenueToday)]].map(x=>'<div class="stat"><b>'+esc(x[1]??0)+"</b>"+x[0]+"</div>").join("");
  document.querySelector('#adminRides').innerHTML=table(["Status","Rider","Driver","Fare"],(r.rides||r||[]).map(x=>[esc(x.status),esc(x.riderName||"—"),esc(x.driverName||"—"),money(x.fare)]));
  document.querySelector('#drivers').innerHTML=table(["Driver","Status","Rating"],(d.drivers||d||[]).map(x=>[esc(x.name),x.online?"Online":"Offline",esc(x.rating??"—")]));
 }catch(e){toast(e.message);stats.innerHTML='<div class="empty">Admin API unavailable.</div>'}
}