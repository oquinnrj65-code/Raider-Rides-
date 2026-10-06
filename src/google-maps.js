let maplibrePromise;
function loadMapLibre(){
  if(maplibrePromise)return maplibrePromise;
  maplibrePromise=(async()=>{
    if(!document.querySelector('link[data-raider-maplibre]')){const link=document.createElement('link');link.rel='stylesheet';link.href='https://unpkg.com/maplibre-gl@6.12.0/dist/maplibre-gl.css';link.dataset.raiderMaplibre='1';document.head.appendChild(link)}
    return import('https://unpkg.com/maplibre-gl@6.12.0/dist/maplibre-gl.mjs');
  })();
  return maplibrePromise;
}
function point(p){if(!p)return [0,0];if(Array.isArray(p))return p;if(typeof p.lng==='function')return [p.lng(),p.lat()];return [Number(p.lng),Number(p.lat)]}
class RaiderMap{
  constructor(el,o={}){const M=o._maplibre.Map;this._maplibre=new M({container:el,style:'https://tiles.openfreemap.org/styles/liberty',center:point(o.center||{lat:33.5779,lng:-101.8552}),zoom:o.zoom||13,attributionControl:true,dragRotate:false,touchPitch:false});this._maplibre.on('click',e=>this._click&&this._click({latLng:{lat:()=>e.lngLat.lat,lng:()=>e.lngLat.lng}}))}
  setCenter(p){this._maplibre.setCenter(point(p))} setZoom(z){this._maplibre.setZoom(z)}
  addListener(event,fn){if(event!=='click')return {remove(){}};this._click=fn;return {remove:()=>{if(this._click===fn)this._click=null}}}
}
class RaiderMarker{
  constructor(o={}){this.o=o;if(o.map)this.setMap(o.map);if(o.position)this.position=o.position}
  setMap(map){this.map=map;if(!map){this.m?.remove();this.m=null;return}this.m=new map._maplibre.Marker({color:'#111'}).setLngLat(point(this.o.position)).addTo(map._maplibre)}
  set position(v){this.o.position=v;if(this.m)this.m.setLngLat(point(v))} get position(){return this.o.position}
}
class PlaceValue{constructor(x){this.displayName=x.display_name||'';this.formattedAddress=x.display_name||'';this.location={lat:()=>Number(x.lat),lng:()=>Number(x.lon)}}}
class Prediction{constructor(x){this.x=x}toPlace(){return new PlaceValue(this.x)}}
class RaiderPlaces extends HTMLElement{
  connectedCallback(){if(this.ready)return;this.ready=true;this.style.display='block';this.style.position='relative';const i=document.createElement('input');i.type='text';i.placeholder=this.placeholder||'Search hotels, bars, restaurants, addresses…';i.autocomplete='off';i.style.cssText='width:100%;box-sizing:border-box;padding:12px;border:1px solid #ccc;border-radius:8px';const list=document.createElement('div');list.style.cssText='position:absolute;left:0;right:0;top:100%;z-index:9999;background:#fff;border:1px solid #ddd;border-radius:0 0 8px 8px;box-shadow:0 4px 14px rgba(0,0,0,.15)';this.input=i;this.list=list;this.append(i,list);let t;i.oninput=()=>{clearTimeout(t);t=setTimeout(()=>this.search(i.value.trim()),350)};i.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();this.search(i.value.trim())}}}
  async search(q){if(!q){this.list.innerHTML='';return}this.list.innerHTML='<div style="padding:10px">Searching…</div>';try{const r=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q='+encodeURIComponent(q),{headers:{Accept:'application/json'}});const a=await r.json();this.list.innerHTML='';a.forEach(x=>{const b=document.createElement('button');b.type='button';b.textContent=x.display_name;b.style.cssText='display:block;width:100%;text-align:left;padding:10px;border:0;background:#fff;cursor:pointer';b.onclick=()=>{this.input.value=x.display_name;this.list.innerHTML='';this.dispatchEvent(new CustomEvent('gmp-select',{detail:{placePrediction:new Prediction(x)}}))};this.list.appendChild(b)});if(!a.length)this.list.innerHTML='<div style="padding:10px">No locations found.</div>'}catch{this.list.innerHTML='<div style="padding:10px">Search unavailable. Enter the address manually.</div>'}}
}
if(!customElements.get('raider-place-autocomplete'))customElements.define('raider-place-autocomplete',RaiderPlaces);
export async function loadGoogleMaps(){const ml=await loadMapLibre();if(window.raiderMaps)return window.raiderMaps;window.raiderMaps={importLibrary:async n=>n==='maps'?{Map:(el,o={})=>new RaiderMap(el,{...o,_maplibre:ml})}:n==='marker'?{AdvancedMarkerElement:RaiderMarker}:n==='places'?{PlaceAutocompleteElement:class extends RaiderPlaces{}}:{}};return window.raiderMaps}
export async function createGoogleMap(el,center={lat:33.5779,lng:-101.8552},zoom=13){const maps=await loadGoogleMaps();const {Map}=await maps.importLibrary('maps');const {AdvancedMarkerElement}=await maps.importLibrary('marker');return {maps,map:Map(el,{center,zoom}),AdvancedMarkerElement}}
export async function createPlaceAutocomplete(input,options={}){const maps=await loadGoogleMaps();const {PlaceAutocompleteElement}=await maps.importLibrary('places');const ac=new PlaceAutocompleteElement(options);ac.placeholder=input.getAttribute('placeholder')||'Search a hotel, bar, restaurant, address…';const host=document.createElement('div');host.className='google-place-autocomplete';host.appendChild(ac);input.replaceWith(host);ac.addEventListener('gmp-select',e=>{const place=e.detail.placePrediction.toPlace();window.dispatchEvent(new CustomEvent('raider-place-selected',{detail:{place,text:place.formattedAddress,inputId:input.id}}))});return ac}
