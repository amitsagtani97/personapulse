import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../worker/index.js';
const app=createApp({'index.html':'PersonaPulse'});
const call=(path,payload,env={})=>app.fetch(new Request(`https://local.test${path}`,{method:payload?'POST':'GET',body:payload?JSON.stringify(payload):undefined}),env);
const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});

test('status and public URL validation',async()=>{
 const status=await (await call('/api/status')).json();assert.equal(status.mode,'demo');assert.equal(status.zoowork,false);
 const page=await call('/');assert.equal(await page.text(),'PersonaPulse');
 const bad=await call('/api/discover',{url:'http://localhost:3000',objective:'test'});assert.equal(bad.status,502);assert.match((await bad.json()).error,/public/);
});

test('competitor discovery uses Tavily public results',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async()=>response({results:[{title:'Shop',url:'https://www.target.com/p/x',content:'merchant'},{title:'Walmart clothing',url:'https://www.walmart.com/cp/clothing',content:'A rival clothing seller'},{title:'Reddit',url:'https://www.reddit.com/thread',content:'forum'}]});
 try{const r=await call('/api/discover',{url:'https://www.target.com/p/x',objective:'clothing fit'}, {TAVILY_API_KEY:'test'});const d=await r.json();assert.equal(d.mode,'live');assert.equal(d.competitors[0].name,'Walmart');assert.equal(d.competitors.length,1)}finally{globalThis.fetch=old}
});

test('shopper uses the shared ZooWork agent and filters citations',async()=>{
 const old=globalThis.fetch;const calls=[];globalThis.fetch=async(input,options)=>{const url=String(input);calls.push(url);if(url.endsWith('/sessions')&&options.method==='POST')return response({session_id:'s1'});if(url.endsWith('/sessions/s1'))return response({run_status:'succeeded'});if(url.includes('/events?'))return response({events:[{eventType:'agent.assistant',payload:{message:{content:[{text:JSON.stringify({merchantScore:77,competitorScore:56,choice:'merchant',quote:'Better fit information.',friction:'Delivery unclear.',opportunity:'Show delivery at product level.',summary:'I compared both.',steps:[],citations:['https://www.target.com/p/x','https://unsafe.test/x']})}]}}}]});throw Error(`Unexpected ${url}`)};
 try{const r=await call('/api/persona',{url:'https://www.target.com/p/x',competitorUrl:'https://www.walmart.com/',objective:'Find clothing',persona:{name:'Maya',age:29,gender:'Woman'},context:{}},{ZOOWORK_API_KEY:'secret',ZOOWORK_AGENT_ID:'a1',ZOOWORK_BASE_URL:'https://mock.test'});const d=await r.json();assert.equal(r.status,200);assert.equal(d.report.merchantScore,77);assert.deepEqual(d.report.citations,['https://www.target.com/p/x']);assert.ok(!calls.some(x=>x.endsWith('/agents')))}finally{globalThis.fetch=old}
});

test('report counts live journeys without claiming measured sales',async()=>{
 const r=await call('/api/report',{reports:[{runSource:'live',persona:{age:29,gender:'Woman',budget:'Value'},report:{choice:'merchant',merchantScore:70,friction:'Sizing'}},{runSource:'error',persona:{age:39,gender:'Man',budget:'Premium'},report:{choice:'competitor'}}]});const d=await r.json();assert.equal(d.stats.completed,1);assert.equal(d.stats.merchantWins,1);assert.equal(d.stats.segments.find(x=>x.segment==='18–29').merchant,1);
});
