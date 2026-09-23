let googlePromise;
export async function loadGoogleMaps(){
  if(window.google?.maps?.importLibrary)return window.google.maps;
  if(googlePromise)return googlePromise;
  googlePromise=(async()=>{
    const base=(window.RAIDER_RIDES_API_BASE_URL||"https://raider-rides-api.onrender.com/api").replace(/\/$/,"");
    const r=await fetch(base+"/config/maps");
    const d=await r.json();
    if(!r.ok||!d.apiKey)throw new Error("Google Maps is not configured yet.");
    await new Promise((resolve,reject)=>{
      const s=document.createElement("script");
      s.src="https://maps.googleapis.com/maps/api/js?key="+encodeURIComponent(d.apiKey)+"&v=weekly&libraries=places,marker";
      s.async=true;s.defer=true;s.onload=resolve;s.onerror=()=>reject(new Error("Google Maps failed to load."));
      document.head.appendChild(s);
    });
    return window.google.maps;
  })();
  return googlePromise;
}
export async function createGoogleMap(el,center={lat:33.5779,lng:-101.8552},zoom=13){
  const maps=await loadGoogleMaps();
  const {Map}=await maps.importLibrary("maps");
  const {AdvancedMarkerElement}=await maps.importLibrary("marker");
  const map=new Map(el,{center,zoom,mapTypeControl:false,streetViewControl:false,fullscreenControl:false,gestureHandling:"greedy"});
  return {maps,map,AdvancedMarkerElement};
}
export async function createPlaceAutocomplete(input,options={}){
  const maps=await loadGoogleMaps();
  const {PlaceAutocompleteElement}=await maps.importLibrary("places");
  const host=document.createElement("div");
  host.className="google-place-autocomplete";
  const ac=new PlaceAutocompleteElement(options);
  ac.placeholder=input.getAttribute("placeholder")||"Search a hotel, bar, restaurant, address…";
  host.appendChild(ac);
  input.replaceWith(host);
  ac.addEventListener("gmp-select",async({placePrediction})=>{
    const place=placePrediction.toPlace();
    await place.fetchFields({fields:["displayName","formattedAddress","location","id"]});
    const text=place.formattedAddress||place.displayName||"";
    window.dispatchEvent(new CustomEvent("raider-place-selected",{detail:{place,text,inputId:input.id}}));
  });
  return ac;
}
