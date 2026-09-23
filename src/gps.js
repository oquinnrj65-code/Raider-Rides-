let map,pickupMarker,dropoffMarker,watchId;
export function initGps(){
 const el=document.querySelector("#gpsMap"),status=document.querySelector("#gpsStatus"),use=document.querySelector("#useGps"),drop=document.querySelector("#setDropoff");
 if(!el||!window.L)return;
 map=L.map(el).setView([33.5779,-101.8552],12);
 L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap contributors"}).addTo(map);
 let dropMode=false;
 use.onclick=()=>{if(!navigator.geolocation){status.textContent="GPS is not supported on this device.";return}status.textContent="Requesting live GPS permission…";watchId=navigator.geolocation.watchPosition(pos=>{const p={lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:Math.round(pos.coords.accuracy)};window.raiderGps.pickup=p;if(!pickupMarker)pickupMarker=L.marker([p.lat,p.lng]).addTo(map).bindPopup("Live pickup").openPopup();else pickupMarker.setLatLng([p.lat,p.lng]);map.setView([p.lat,p.lng],15);status.textContent="Live pickup GPS: ±"+p.accuracy+" m";const a=document.querySelector("#pickup");a.value=p.lat.toFixed(6)+", "+p.lng.toFixed(6)},err=>{status.textContent="GPS error: "+err.message},{enableHighAccuracy:true,maximumAge:5000,timeout:10000})};
 drop.onclick=()=>{dropMode=!dropMode;drop.textContent=dropMode?"Tap the map now":"Tap map to set drop-off";status.textContent=dropMode?"Tap the map where you want to be dropped off.":"Drop-off selection paused."};
 map.on("click",e=>{if(!dropMode)return;const p={lat:e.latlng.lat,lng:e.latlng.lng};window.raiderGps.dropoff=p;if(!dropoffMarker)dropoffMarker=L.marker([p.lat,p.lng]).addTo(map).bindPopup("Drop-off").openPopup();else dropoffMarker.setLatLng([p.lat,p.lng]);document.querySelector("#destination").value=p.lat.toFixed(6)+", "+p.lng.toFixed(6);dropMode=false;drop.textContent="Tap map to set drop-off";status.textContent="Drop-off GPS selected."});
}
export function stopGps(){if(watchId&&navigator.geolocation)navigator.geolocation.clearWatch(watchId)}