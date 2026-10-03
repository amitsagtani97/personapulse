import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createApp } from './worker/index.js';

try {
  const lines=(await readFile(new URL('.env',import.meta.url),'utf8')).split(/\r?\n/);
  for(const line of lines){const match=line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);if(match&&process.env[match[1]]===undefined)process.env[match[1]]=match[2].replace(/^['"]|['"]$/g,'')}
}catch{}
const files=['index.html','styles.css','app.js','favicon.svg'];
const assets=Object.fromEntries(await Promise.all(files.map(async name=>[name,await readFile(new URL(`web/${name}`,import.meta.url),'utf8')])));
const app=createApp(assets);
createServer(async(req,res)=>{
  const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>60000){res.writeHead(413);res.end();return}chunks.push(chunk)}
  const request=new Request(`http://localhost:${process.env.PORT||4173}${req.url}`,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});
  const response=await app.fetch(request,process.env);
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
}).listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log(`PersonaPulse ready at http://localhost:${process.env.PORT||4173}`));
