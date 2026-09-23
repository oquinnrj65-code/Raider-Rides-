import http from "node:http";import {randomUUID} from "node:crypto";
const port=process.env.PORT||10000;const rides=[];const drivers=[{id:"d1",name:"Demo Driver",online:true,rating:5,todayEarnings:0,completedToday:0}];
const allowed=(process.env.ALLOWED_ORIGINS||"").split(",").map(x=>x.trim()).filter(Boolean);
const send=(res,status,data)=>{const o=res.reqOrigin;if(!o||!allowed.length||allowed.includes(o))res.setHeader("Access-Control-Allow-Origin",o||"*");res.setHeader("Vary","Origin");res.setHeader("Access-Control-Allow-Headers","Content-Type,Authorization");res.setHeader("Access-Control-Allow-Methods","GET,POST,PATCH,OPTIONS");res.setHeader("Content-Type","application/json");res.writeHead(status);res.end(JSON.stringify(data))};
const body=req=>new Promise((resolve,reject)=>{let s="";req.on("data",c=>s+=c);req.on("end",()=>{try{resolve(s?JSON.parse(s):{})}catch(e){reject(e)}})});
const fare=b=>Number((12+Math.max(0,String(b.pickup||"").length+String(b.destination||"").length)*.18+(b.rideType==="xl"?7:b.rideType==="premium"?12:0)).toFixed(2));
const app=async(req,res)=>{res.reqOrigin=req.headers.origin;if(req.method==="OPTIONS"){send(res,204,{});return}const method=req.method,path=req.url.split("?")[0].replace(/\/$/,"");try{
if(method==="GET"&&path==="/api/health")return send(res,200,{ok:true,service:"raider-rides-api"});
if(method==="GET"&&path==="/api/rider/profile")return send(res,200,{name:"Demo Rider"});
if(method==="GET"&&path==="/api/rider/rides")return send(res,200,{rides:rides.filter(r=>r.riderId==="demo")});
if(method==="POST"&&path==="/api/rides/estimate"){const b=await body(req);const f=fare(b);return send(res,200,{fare:f,estimatedFare:f,durationMinutes:15})}
if(method==="POST"&&path==="/api/rides"){const b=await body(req);if(!b.pickup||!b.destination)return send(res,400,{message:"Pickup and destination are required"});const r={id:randomUUID(),riderId:"demo",driverId:null,status:"requested",pickup:b.pickup,destination:b.destination,rideType:b.rideType||"standard",passengers:Number(b.passengers)||1,fare:fare(b),createdAt:new Date().toISOString()};rides.unshift(r);return send(res,201,r)}
if(method==="GET"&&path==="/api/driver/profile")return send(res,200,drivers[0]);
if(method==="GET"&&path==="/api/driver/rides")return send(res,200,{rides});
if(method==="PATCH"&&path==="/api/driver/status"){const b=await body(req);drivers[0].online=!!b.online;return send(res,200,{online:drivers[0].online})}
if(method==="GET"&&path==="/api/admin/stats")return send(res,200,{activeRides:rides.filter(r=>!["completed","cancelled"].includes(r.status)).length,driversOnline:drivers.filter(d=>d.online).length,ridesToday:rides.length,revenueToday:rides.reduce((n,r)=>n+r.fare,0)});
if(method==="GET"&&path==="/api/admin/rides")return send(res,200,{rides});
if(method==="GET"&&path==="/api/admin/drivers")return send(res,200,{drivers});
const m=path.match(/^\/api\/driver\/rides\/([^/]+)\/(accept|complete)$/);if(method==="POST"&&m){const r=rides.find(x=>x.id===m[1]);if(!r)return send(res,404,{message:"Ride not found"});r.status=m[2]==="accept"?"accepted":"completed";if(m[2]==="accept")r.driverId="d1";else{drivers[0].completedToday++;drivers[0].todayEarnings+=r.fare}return send(res,200,r)}
return send(res,404,{message:"Not found"})}catch(e){console.error(e);return send(res,500,{message:"Internal server error"})}};
http.createServer(app).listen(port,()=>console.log("Raider Rides API listening on "+port));