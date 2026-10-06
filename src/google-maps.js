let leafletPromise;
function loadLeaflet(){
 if(window.L)return Promise.resolve(window.L);
 if(leafletPromise)return leafletPromise;
 leafletPromise=new Promise((resolve,reject)=>{
  const cssUrls=['https://unpkg.com/leaflet@1.9.4/dist/leaflet.css','https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css'];
  const jsUrls=['https://unpkg.com/leaflet@1.9.4/dist/leaflet.js','https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js'];
  const addCss=(url)=>{if(!document.querySelector('link[data-raider-leaflet]')){const link=document.createElement('link');link.rel='stylesheet';link.href=url;link.dataset.raiderLeaflet='1';document.head.appendChild(link)}};
  addCss(cssUrls[0]);
  const tryScript=(i)=>{if(window.L)return resolve(window.L);if(i>=jsUrls.length)return reject(new Error('Free map library could not load. Check your internet connection and reload Raider Rides.'));const script=document.createElement('script');script.src=jsUrls[i];script.async=true;script.onload=()=>window.L?resolve(window.L):tryScript(i+1);script.onerror=()=>tryScript(i+1);document.head.appendChild(script)};
  tryScript(0);
 });
 return leafletPromise;
}
function point(p){if(!p)return [33.5779,-101.8552];if(Array.isArray(p))return p;if(typeof p.lat==='function')return [Number(p.lat()),Number(p.lng())];return [Number(p.lat),Number(p.lng)]}
class RaiderMap{
 constructor(el,o={}){
  if(!el)throw new Error('Map container not found.');
  const L=o._leaflet||window.L;
  if(!L)throw new Error('Free map library could not load.');
  el.style.display='block';el.style.width='100%';el.style.height='360px';el.style.minHeight='360px';el.style.position='relative';
  this._leaflet=L.map(el,{zoomControl:true,attributionControl:true,preferCanvas:false});
  this._leaflet.setView(point(o.center||{lat:33.5779,lng:-101.8552}),Number(o.zoom)||13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors',crossOrigin:true}).addTo(this._leaflet);
  this._leaflet.on('click',e=>this._click&&this._click({latLng:{lat:()=>e.latlng.lat,lng:()=>e.latlng.lng}}));
  const resize=()=>this._leaflet&&this._leaflet.invalidateSize({pan:false});
  requestAnimationFrame(resize);setTimeout(resize,100);setTimeout(resize,500);setTimeout(resize,1500);
 }
 setCenter(p){this._leaflet.setView(point(p),this._leaflet.getZoom(),{animate:false})}
 setZoom(z){this._leaflet.setZoom(z)}
 resize(){this._leaflet.invalidateSize({pan:false})}
 addListener(event,fn){if(event!=='click')return{remove(){}};this._click=fn;return{remove:()=>{if(this._click===fn)this._click=null}}}
}
class RaiderMarker{
 constructor(o={}){this.o=o;this.map=null;this.m=null;if(o.map)this.setMap(o.map)}
 setMap(map){this.map=map;if(!map){this.m?.remove();this.m=null;return}this.m=window.L.marker(point(this.o.position)).addTo(map._leaflet);if(this.o.title)this.m.bindTooltip(this.o.title)}
 set position(v){this.o.position=v;if(this.m)this.m.setLatLng(point(v))}
 get position(){return this.o.position}
}
class PlaceValue{
 constructor(x){this.displayName=x.display_name||'';this.formattedAddress=x.display_name||'';this.location={lat:()=>Number(x.lat),lng:()=>Number(x.lon)};this._raw=x}
 async fetchFields(){return this}
}
class Prediction{constructor(x){this.x=x}toPlace(){return new PlaceValue(this.x)}}
class RaiderPlaces extends HTMLElement{
 connectedCallback(){if(this.ready)return;this.ready=true;this.style.display='block';this.style.position='relative';const i=document.createElement('input');i.type='text';i.placeholder=this.placeholder||'Search hotels, bars, restaurants, addresses…';i.autocomplete='off';i.setAttribute('aria-label','Destination / hotel / bar / restaurant');i.style.cssText='width:100%;box-sizing:border-box;padding:12px;border:1px solid #ccc;border-radius:8px;background:#111;color:#fff';const list=document.createElement('div');list.style.cssText='position:absolute;left:0;right:0;top:100%;z-index:9999;background:#fff;color:#111;border:1px solid #ddd;border-radius:0 0 8px 8px;box-shadow:0 4px 14px rgba(0,0,0,.15);max-height:260px;overflow:auto';this.input=i;this.list=list;this.append(i,list);let t;i.oninput=()=>{clearTimeout(t);t=setTimeout(()=>this.search(i.value.trim()),350)};i.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();this.search(i.value.trim())}}}
 async search(q){if(!q){this.list.innerHTML='';return}this.list.innerHTML='<div style="padding:10px">Searching…</div>';try{const r=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q='+encodeURIComponent(q),{headers:{Accept:'application/json'}});if(!r.ok)throw Error('Search unavailable');const a=await r.json();this.list.innerHTML='';a.forEach(x=>{const b=document.createElement('button');b.type='button';b.textContent=x.display_name;b.style.cssText='display:block;width:100%;text-align:left;padding:10px;border:0;background:#fff;color:#111;cursor:pointer';b.onclick=()=>{this.input.value=x.display_name;this.list.innerHTML='';const ev=new Event('gmp-select');ev.placePrediction=new Prediction(x);this.dispatchEvent(ev)};this.list.appendChild(b)});if(!a.length)this.list.innerHTML='<div style="padding:10px">No locations found.</div>'}catch{this.list.innerHTML='<div style="padding:10px">Search unavailable. You can enter the address manually.</div>'}}
}
if(!customElements.get('raider-place-autocomplete'))customElements.define('raider-place-autocomplete',RaiderPlaces);
function createPlaceElement(){return document.createElement('raider-place-autocomplete')}
export async function loadGoogleMaps(){const L=await loadLeaflet();if(window.raiderMaps)return window.raiderMaps;window.raiderMaps={importLibrary:async n=>n==='maps'?{Map:(el,o={})=>new RaiderMap(el,{...o,_leaflet:L})}:n==='marker'?{AdvancedMarkerElement:RaiderMarker}:n==='places'?{PlaceAutocompleteElement:createPlaceElement}:{}};return window.raiderMaps}
export async function createGoogleMap(el,center={lat:33.5779,lng:-101.8552},zoom=13){const maps=await loadGoogleMaps();const{Map}=await maps.importLibrary('maps');const{AdvancedMarkerElement}=await maps.importLibrary('marker');return{maps,map:Map(el,{center,zoom}),AdvancedMarkerElement}}
export async function createPlaceAutocomplete(input,options={}){await loadLeaflet();const ac=createPlaceElement();ac.placeholder=input.getAttribute('placeholder')||'Search a hotel, bar, restaurant, address…';const host=document.createElement('div');host.className='google-place-autocomplete';host.appendChild(ac);input.replaceWith(host);ac.addEventListener('gmp-select',e=>{const place=e.placePrediction.toPlace();window.dispatchEvent(new CustomEvent('raider-place-selected',{detail:{place,text:place.formattedAddress,inputId:input.id}}))});return ac}
