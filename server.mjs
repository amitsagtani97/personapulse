import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { band, tavily, zoowork } from './lib/adapters.mjs';

// Local-only env loading without a package dependency. Never serve this file.
try {
  const env = await readFile(new URL('.env', import.meta.url), 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
} catch {}

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'dist');
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.json':'application/json' };
const json = (res, code, value) => { res.writeHead(code, { 'content-type':'application/json', 'cache-control':'no-store' }); res.end(JSON.stringify(value)); };
async function body(req) { let raw=''; for await (const chunk of req) { raw += chunk; if(raw.length>16000) throw new Error('Request too large'); } return JSON.parse(raw || '{}'); }

createServer(async (req,res) => {
  try {
    if(req.url === '/api/status') return json(res,200,{ zoowork:zoowork.available(), tavily:tavily.available(), band:band.available() });
    if(req.method === 'POST' && req.url === '/api/extract') return json(res,200,await tavily.extract(String((await body(req)).query || '').slice(0,300)));
    if(req.method === 'POST' && req.url === '/api/run') return json(res,200,await zoowork.run(await body(req)));
    if(req.method === 'POST' && req.url === '/api/focus') return json(res,200,await band.send(String((await body(req)).message || '').slice(0,1000)));
    const path = normalize(decodeURIComponent((req.url || '/').split('?')[0])).replace(/^\/+/, '') || 'index.html';
    if(path.startsWith('..')) return json(res,403,{error:'Forbidden'});
    const content = await readFile(join(root,path));
    res.writeHead(200,{ 'content-type':types[extname(path)] || 'application/octet-stream' }); res.end(content);
  } catch(error) {
    if(req.url?.startsWith('/api/')) return json(res,502,{error:error.message});
    res.writeHead(404); res.end('Not found');
  }
}).listen(Number(process.env.PORT || 4173), () => console.log(`PersonaPulse ready at http://localhost:${process.env.PORT || 4173}`));
