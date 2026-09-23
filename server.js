import http from "node:http";import {randomUUID} from "node:crypto";
const port=process.env.PORT||10000;const rides=[];const drivers=[{id:"d1",name:"Demo Driver",online:true,rating:5}];
const json=(res,status,data)=>{res.writeHead(status,{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type,Authorization","Access-Control-Allow-Methods":"GET,POST,PATCH,OPTIONS"});res.end(JSON.stringify(data))};
const body=req=>new Promise((resolve,reject)=>{let s="";req.on("data",c=>s+=c);req.on("end",()=>{try{resolve(s?JSON.parse(s):{})}catch(e){reject(e)}})});
const route=(method,path)=>{const p=path.replace(/\/$/,"");return{method,path:p}};
const app=async(req,res)=>{if(req.method==="OPTIONS")return json(res,204,{});const {method,path}=route(req.method,req.url.split("?")[0]);try{
if(method==="GET"&&path==="/api/health")return json(res,200,{ok:true,service:"raider-rides-api"});
if(method==="GET"&&path==="/api/rider/profile")return json(res,200,{name:"Demo Rider"});
if(method==="GET"&&path==="/api/rider/rides")return json(res,200,{rides:rides.filter(r=>r.riderId==="demo")});
if(method==="POST"&&path==="/api/rides/estimate"){const b=await body(req);const fare=12+Math.max(0,String(b.pickup||"").length+String(b.destination||"").length)*.18+(b.rideType==="xl"?7:b.rideType==="premium"?12:0);return json(res,200,{fare:Number(fare.toFixed(2)),estimatedFare:Number(fare.toFixed(2)),durationMinutes:15})}
if(method==="POST"&&path==="/api/rides"){const b=await body(req);const ride={id:randomUUID(),riderId:"demo",status:"requested",pickup:b.pickup,destination:b.destination,rideType:b.rideType||"standard",passengers:b.passengers||1,fare:0,createdAt:new Date().toISOString()};rides.unshift(ride);return json(res,201,ride)}
if(method==="GET"&&path==="/api/driver/profile")return json(res,200,{name:drivers[0].name,todayEarnings:0,completedToday:0,rating:drivers[0].rating});
if(method==="GET"&&path==="/api/driver/rides")return json(res,200,{rides});
if(method==="PATCH"&&path==="/api/driver/status"){const b=await body(req);drivers[0].online=!!b.online;return json(res,200,{online:drivers[0].online})}
if(method==="GET"&&path==="/api/admin/stats")return json(res,200,{activeRides:rides.filter(r=>!["completed","cancelled"].includes(r.status)).length,driversOnline:drivers.filter(d=>d.online).length,ridesToday:rides.length,revenueToday:rides.reduce((n,r)=>n+Number(r.fare||0),0)});
if(method==="GET"&&path==="/api/admin/rides")return json(res,200,{rides});
if(method==="GET"&&path==="/api/admin/drivers")return json(res,200,{drivers});
const m=path.match(/^\/api\/driver\/rides\/([^/]+)\/(accept|complete)$/);if(method==="POST"&&m){const r=rides.find(x=>x.id===m[1]);if(!r)return json(res,404,{message:"Ride not found"});r.status=m[2]==="accept"?"accepted":"completed";if(m[2]==="accept")r.driverId="d1";return json(res,200,r)}
return json(res,404,{message:"Not found"});
}catch(e){return json(res,500,{message:e.message})}};
http.createServer(app).listen(port,()=>console.log("Raider Rides API listening on "+port));