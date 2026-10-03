import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../worker/index.js';
const app=createApp({'index.html':'<h1>PersonaPulse</h1>'});
const call=(path,payload,env={})=>app.fetch(new Request(`https://example.test${path}`,{method:payload?'POST':'GET',body:payload?JSON.stringify(payload):undefined}),env);
const provider=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});

test('demo status exposes no secrets and serves the floor',async()=>{
 const response=await call('/api/status');assert.deepEqual(await response.json(),{zoowork:false,tavily:false,band:false,mode:'demo'});
 const page=await call('/');assert.match(await page.text(),/PersonaPulse/);
});

test('live shopper executes a ZooWork session and keeps only retrieved citations',async()=>{
 const original=globalThis.fetch;const calls=[];
 globalThis.fetch=async(input,options)=>{const url=String(input);calls.push(`${options?.method||'GET'} ${url}`);
  if(url.endsWith('/agents')&&options.method==='POST')return provider({agent_id:'agt_test'});
  if(url.endsWith('/agents/agt_test/start'))return provider({warnings:[]});
  if(url.endsWith('/agents/agt_test')&&options.method==='GET')return provider({status:{desired_state:'running'}});
  if(url.endsWith('/agents/agt_test/sessions')&&options.method==='POST')return provider({session_id:'sess_test'});
  if(url.endsWith('/agents/agt_test/sessions/sess_test')&&options.method==='GET')return provider({run_status:'succeeded'});
  if(url.includes('/events?'))return provider({events:[{eventType:'agent.assistant',payload:{message:{content:[{type:'text',text:JSON.stringify({targetScore:76,walmartScore:64,choice:'Target',quote:'Better styling.',friction:'Fit notes are thin.',summary:'Target felt clearer.',steps:[{stage:'Search',action:'Reviewed the clothing results',retailer:'Target'}],citations:['https://www.target.com/item','https://invented.test/item']})}]}}}]});
  if(url.endsWith('/agents/agt_test/stop'))return provider({warnings:[]});
  if(url.endsWith('/agents/agt_test')&&options.method==='DELETE')return provider({});
  throw Error(`Unexpected request ${url}`);
 };
 try{const response=await call('/api/persona',{persona:{name:'Maya',age:29,location:'NY',need:'Dinner outfit'},mission:'Clothing',context:{target:[{title:'Item',url:'https://www.target.com/item',content:'Shirt details'}],walmart:[]}},{ZOOWORK_API_KEY:'test',ZOOWORK_BASE_URL:'https://mock.test'});const data=await response.json();assert.equal(response.status,200);assert.equal(data.mode,'live');assert.equal(data.report.targetScore,76);assert.deepEqual(data.report.citations,['https://www.target.com/item']);assert.ok(calls.some(x=>x.includes('DELETE https://mock.test/agents/agt_test')))}finally{globalThis.fetch=original}
});

test('ZooWork-only shopper uses web tools and accepts retailer links',async()=>{
 const original=globalThis.fetch;let policy;
 globalThis.fetch=async(input,options)=>{const url=String(input);
  if(url.endsWith('/agents')&&options.method==='POST'){policy=JSON.parse(options.body).resource.tool_policy;return provider({agent_id:'agt_web'})}
  if(url.endsWith('/agents/agt_web/start'))return provider({warnings:[]});
  if(url.endsWith('/agents/agt_web')&&options.method==='GET')return provider({status:{desired_state:'running'}});
  if(url.endsWith('/agents/agt_web/sessions')&&options.method==='POST')return provider({session_id:'sess_web'});
  if(url.endsWith('/agents/agt_web/sessions/sess_web')&&options.method==='GET')return provider({run_status:'succeeded'});
  if(url.includes('/events?'))return provider({events:[{eventType:'agent.assistant',payload:{message:{content:[{type:'text',text:JSON.stringify({targetScore:58,walmartScore:52,choice:'Target',quote:'I liked the style.',friction:'Limited evidence.',summary:'Public page only.',steps:[],citations:['https://www.target.com/p/item','https://elsewhere.test/item']})}]}}}]});
  if(url.endsWith('/agents/agt_web/stop'))return provider({warnings:[]});
  if(url.endsWith('/agents/agt_web')&&options.method==='DELETE')return provider({});
  throw Error(`Unexpected request ${url}`);
 };
 try{const response=await call('/api/persona',{persona:{name:'Maya',need:'Outfit'},mission:'Clothing',context:{}},{ZOOWORK_API_KEY:'test',ZOOWORK_BASE_URL:'https://mock.test'});const data=await response.json();assert.equal(response.status,200);assert.deepEqual(policy,{allow:['web_search','web_fetch']});assert.equal(data.evidenceSource,'zoowork-web-tools');assert.deepEqual(data.report.citations,['https://www.target.com/p/item'])}finally{globalThis.fetch=original}
});
