const app=document.querySelector('#app');
let raiderInstallPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();raiderInstallPrompt=e;window.__raiderInstallPrompt=true;});
window.addEventListener('appinstalled',()=>{window.__raiderInstalled=true;});
async function raiderPwaDebug(){
  if(!location.search.includes('pwa-debug=1'))return;
  const role=location.pathname.split('/').filter(Boolean)[0]||'rider';
  const box=document.createElement('aside');
  box.id='raider-pwa-debug';
  box.style.cssText='position:fixed;z-index:99999;left:10px;right:10px;bottom:10px;max-height:72vh;overflow:auto;background:#111;color:#fff;border:2px solid #b00020;border-radius:14px;padding:14px;font:14px/1.45 monospace;box-shadow:0 8px 30px #000';
  box.innerHTML='<b>PWA diagnostics</b><div id="pwa-debug-body">Checking…</div>';
  document.body.appendChild(box);
  const body=box.querySelector('#pwa-debug-body');
  const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  const rows=[];
  rows.push(['URL',location.href]);
  rows.push(['Manifest link',document.querySelector('link[rel="manifest"]')?.href||'MISSING']);
  rows.push(['SW controller',navigator.serviceWorker?.controller?.scriptURL||'none']);
  rows.push(['Standalone',matchMedia('(display-mode: standalone)').matches?'YES':'NO']);
  rows.push(['beforeinstallprompt',window.__raiderInstallPrompt?'FIRED':'not fired']);
  const manifestHref=document.querySelector('link[rel="manifest"]')?.href;
  if(manifestHref){
    try{
      const mr=await fetch(manifestHref,{cache:'no-store'});
      rows.push(['Manifest HTTP',mr.status+' '+mr.statusText]);
      rows.push(['Manifest type',mr.headers.get('content-type')||'none']);
      const txt=await mr.text();
      let m;
      try{m=JSON.parse(txt);rows.push(['Manifest JSON','VALID']);}
      catch(e){rows.push(['Manifest JSON','INVALID: '+e.message]);}
      if(m){
        rows.push(['name',m.name||'MISSING']);
        rows.push(['short_name',m.short_name||'MISSING']);
        rows.push(['start_url',m.start_url||'MISSING']);
        rows.push(['scope',m.scope||'MISSING']);
        rows.push(['display',m.display||'MISSING']);
        rows.push(['icons',Array.isArray(m.icons)?m.icons.map(i=>i.src+' '+i.sizes).join(' | '):'MISSING']);
        for(const icon of (Array.isArray(m.icons)?m.icons.slice(0,3):[])){
          try{const ir=await fetch(new URL(icon.src,manifestHref),{cache:'no-store'});rows.push(['icon '+icon.src,ir.status+' '+(ir.headers.get('content-type')||'')]);}
          catch(e){rows.push(['icon '+icon.src,'ERROR '+e.message]);}
        }
      }else rows.push(['Manifest preview',txt.slice(0,240)]);
    }catch(e){rows.push(['Manifest fetch','ERROR: '+e.message]);}
  }
  try{
    const regs=await navigator.serviceWorker.getRegistrations();
    rows.push(['SW registrations',regs.map(r=>r.scope+' | '+(r.active?.scriptURL||r.installing?.scriptURL||r.waiting?.scriptURL||'no worker')).join(' || ')||'none']);
  }catch(e){rows.push(['SW registration check','ERROR: '+e.message]);}
  body.innerHTML=rows.map(([k,v])=>'<div><b>'+esc(k)+':</b> '+esc(v)+'</div>').join('');
  const close=document.createElement('button');
  close.textContent='Close diagnostics';
  close.style.cssText='margin-top:10px;padding:10px;border-radius:8px';
  close.onclick=()=>box.remove();
  box.appendChild(close);
}
const pwaDebugTimer=setInterval(()=>{if(document.body){clearInterval(pwaDebugTimer);raiderPwaDebug()}},50);async function load(){const key=location.pathname.split('/').filter(Boolean)[0]||'rider';try{const mod=key==='driver'?await import('./driver.js'):key==='admin'?await import('./admin.js'):await import('./rider.js');const fn=key==='driver'?mod.renderDriver:key==='admin'?mod.renderAdmin:mod.renderRider;await fn()}catch(err){console.error(err);if(app){const safe=String(err?.message||err).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');app.innerHTML='<main><section class="card"><h2>Raider Rides could not load</h2><p class="error-card">'+safe+'</p><button class="primary" onclick="location.reload()">Reload</button></section></main>'}}}document.addEventListener('click',e=>{const a=e.target.closest('[data-link]');if(a){e.preventDefault();history.pushState({},'',a.href);load()}});addEventListener('popstate',load);load();