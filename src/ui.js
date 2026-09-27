export const esc=x=>{let s=String(x??'');return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll("'",'&#39;').replaceAll('"','&quot;')};export const money=x=>Number(x||0).toLocaleString('en-US',{style:'currency',currency:'USD'});
const appMeta={
 rider:{label:"RIDER APP",tag:"SAFE. RELIABLE. ON TIME.",footer:"YOUR RIDE. OUR PRIORITY."},
 driver:{label:"DRIVER APP",tag:"DRIVE. EARN. BE PART OF SOMETHING BIGGER.",footer:"DRIVE WITH PURPOSE."},
 admin:{label:"ADMIN APP",tag:"MANAGE. APPROVE. GROW.",footer:"BUILDING A BETTER TOMORROW."}
};
export function shell(title,active,body){
 const m=appMeta[active]||appMeta.rider;
 return '<div class="app-shell"><header class="top"><button class="mobile-menu" type="button" aria-label="Menu">☰</button><a class="brand" href="/'+active+'" data-link><img src="/assets/raider-rides-logo.svg" alt="Raider Rides"></a><nav class="nav">'+['rider','driver','admin'].map(x=>'<a class="'+(x===active?'active':'')+'" href="/'+x+'" data-link>'+x[0].toUpperCase()+x.slice(1)+'</a>').join('')+'</nav><span class="status"><i></i> API LIVE</span></header><main><section class="app-hero"><img src="/assets/raider-rides-logo.svg" alt=""><div><p class="eyebrow">RAIDER RIDES</p><h1>'+m.label+'</h1><p>'+m.tag+'</p></div></section><div class="app-content">'+body+'</div><footer class="app-footer"><span>RAIDER RIDES</span><strong>'+m.footer+'</strong></footer></main></div>';
}
export const card=(t,b)=>'<section class="card"><div class="card-title"><span>'+t+'</span></div>'+b+'</section>';
export const table=(hs,rs)=>'<div class="table-wrap"><table><thead><tr>'+hs.map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>'+(rs.length?rs.map(r=>'<tr>'+r.map(x=>'<td>'+x+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="'+hs.length+'" class="empty">No records.</td></tr>')+'</tbody></table></div>';
export const toast=m=>{const x=document.createElement('div');x.className='toast';x.textContent=m;document.body.append(x);setTimeout(()=>x.remove(),3000)};
