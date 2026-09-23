const app=document.querySelector("#app");
async function load(){
  const key=location.pathname.split("/").filter(Boolean)[0]||"rider";
  try{
    const mod=key==="driver"?await import("./driver.js"):key==="admin"?await import("./admin.js"):await import("./rider.js");
    const fn=key==="driver"?mod.renderDriver:key==="admin"?mod.renderAdmin:mod.renderRider;
    await fn();
  }catch(err){
    console.error(err);
    if(app)app.innerHTML='<main><section class="card"><h2>Raider Rides could not load</h2><p class="error-card">'+String(err?.message||err).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))+'</p><button class="primary" onclick="location.reload()">Reload</button></section></main>';
  }
}
document.addEventListener("click",e=>{const a=e.target.closest("[data-link]");if(a){e.preventDefault();history.pushState({}, "", a.href);load()}});
addEventListener("popstate",load);load();
