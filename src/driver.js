import { api } from "./api.js";
import { shell, card, table, esc, money, toast } from "./ui.js";

let refreshTimer;

export async function renderDriver(){
  clearInterval(refreshTimer);
  const app=document.querySelector("#app");
  app.innerHTML=shell("Driver","driver",
    '<div id="driverError"></div>'+
    '<div id="driverStats" class="stats">Loading driver dashboard…</div>'+
    '<div class="grid">'+
      card("Shift",
        '<div class="driver-shift">'+
          '<div><strong id="driverName">Driver</strong><div id="driverShiftStatus" class="muted">Loading status…</div></div>'+
          '<button id="onlineButton" class="primary" type="button">Go online</button>'+
        '</div>'+
        '<div class="driver-note">Go online to receive and accept new ride requests.</div>'
      )+
      card("Active trip",'<div id="activeTrip">No active trip.</div>')+
    '</div>'+
    card("Available rides",'<div class="section-actions"><button id="refreshRides" class="secondary" type="button">Refresh rides</button><span id="lastUpdated" class="muted"></span></div><div id="availableRides">Loading…</div>')+
    card("My completed rides",'<div id="completedRides">Loading…</div>')
  );

  const state={online:false,rides:[],profile:null};
  const $=s=>document.querySelector(s);

  async function load(){
    try{
      const [profileData,rideData]=await Promise.all([api.driver.profile(),api.driver.rides()]);
      state.profile=profileData||{};
      state.rides=rideData?.rides||rideData||[];
      state.online=!!state.profile.online;
      render();
      $("#lastUpdated").textContent="Updated "+new Date().toLocaleTimeString();
    }catch(err){
      $("#driverError").innerHTML='<div class="error-card">'+esc(err.message||"Driver API unavailable.")+'</div>';
      $("#availableRides").innerHTML='<div class="empty">Could not load rides. Check the API connection.</div>';
      toast(err.message||"Driver API unavailable.");
    }
  }

  function navigate(destination){
    const url="https://www.google.com/maps/dir/?api=1&destination="+encodeURIComponent(destination||"");
    window.open(url,"_blank","noopener,noreferrer");
  }

  function render(){
    const profile=state.profile||{};
    $("#driverName").textContent=profile.name||"Driver";
    $("#driverShiftStatus").textContent=state.online?"Online • accepting requests":"Offline • not accepting requests";
    $("#onlineButton").textContent=state.online?"Go offline":"Go online";
    $("#onlineButton").className=state.online?"secondary":"primary";

    $("#driverStats").innerHTML=[
      ["Today's earnings",money(profile.todayEarnings)],
      ["Completed today",profile.completedToday??0],
      ["Rating",profile.rating??"—"],
      ["Shift",state.online?"ONLINE":"OFFLINE"]
    ].map(([label,value])=>'<div class="stat"><b>'+esc(value)+'</b>'+esc(label)+'</div>').join("");

    const active=state.rides.find(r=>r.driverId==="d1"&&r.status==="accepted");
    if(active){
      $("#activeTrip").innerHTML=
        '<div class="trip-card">'+
          '<div class="trip-status">ACTIVE TRIP</div>'+
          '<h3>'+esc(active.pickup)+' → '+esc(active.destination)+'</h3>'+
          '<div class="trip-meta"><span>'+esc(active.rideType||"standard").toUpperCase()+'</span><span>'+esc(active.passengers||1)+' passenger(s)</span><strong>'+money(active.fare)+'</strong></div>'+
          '<button id="completeActive" class="primary" type="button">Complete ride</button>'+
        '</div>';
      $("#navPickup").onclick=()=>navigate(active.pickup);
      $("#navDropoff").onclick=()=>navigate(active.destination);
      $("#completeActive").onclick=async()=>{
        const button=$("#completeActive");
        button.disabled=true;
        try{await api.driver.complete(active.id);toast("Ride completed");await load()}
        catch(e){button.disabled=false;toast(e.message)}
      };
    }else{
      $("#activeTrip").innerHTML='<div class="empty">No active trip. Accept a requested ride to start one.</div>';
    }

    const available=state.rides.filter(r=>r.status==="requested"&&!r.driverId);
    $("#availableRides").innerHTML=available.length?table(
      ["Pickup","Destination","Type","Passengers","Fare","Action"],
      available.map(r=>[
        esc(r.pickup),
        esc(r.destination),
        esc((r.rideType||"standard").toUpperCase()),
        esc(r.passengers||1),
        money(r.fare),
        '<button class="small accept-ride" data-id="'+esc(r.id)+'" type="button">Accept</button>'
      ])
    ):'<div class="empty">'+(state.online?"No new ride requests right now.":"Go online to receive ride requests.")+'</div>';

    $("#availableRides").querySelectorAll(".accept-ride").forEach(button=>{
      button.onclick=async()=>{
        button.disabled=true;
        try{
          await api.driver.accept(button.dataset.id);
          toast("Ride accepted");
          await load();
        }catch(e){button.disabled=false;toast(e.message)}
      };
    });

    const completed=state.rides.filter(r=>r.driverId==="d1"&&r.status==="completed");
    $("#completedRides").innerHTML=completed.length?table(
      ["Pickup","Destination","Fare","Completed"],
      completed.slice(0,25).map(r=>[
        esc(r.pickup),esc(r.destination),money(r.fare),
        esc(r.completedAt?new Date(r.completedAt).toLocaleString():"—")
      ])
    ):'<div class="empty">No completed rides yet.</div>';
  }

  $("#onlineButton").onclick=async()=>{
    const next=!state.online;
    const button=$("#onlineButton");
    button.disabled=true;
    try{
      await api.driver.status(next);
      state.online=next;
      toast(next?"You are online":"You are offline");
      await load();
    }catch(e){toast(e.message)}
    finally{button.disabled=false}
  };

  $("#refreshRides").onclick=async()=>{await load()};
  await load();
  refreshTimer=setInterval(load,10000);
}
