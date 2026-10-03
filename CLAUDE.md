# PersonaPulse Development Context

PersonaPulse is a synthetic shopper panel for market testing. Users provide a product/store URL and research question, then 100 AI-powered personas explore the merchant and a competitor, returning segment-level recommendations.

## Architecture

**Frontend** (`web/app.js`, `web/styles.css`, `web/index.html`):
- Flow: brief → competitors → run (animated floor scene) → report
- Manages 100 personas, runs them in parallel (up to 6 concurrent sessions)
- Stores results in localStorage for resume capability
- Floor canvas shows real-time shopper movement tied to session state

**Backend** (`worker/index.js`, `server.mjs`):
- `worker/index.js`: ZooWork, Tavily, and Band adapters; express-like routing
- `server.mjs`: Local Node.js host using the same worker code (120KB request limit on line 13)
- APIs: `/api/discover`, `/api/context`, `/api/persona`, `/api/report`, `/api/focus`, `/api/whatif`

**Deployment**:
- Local: `npm start` (Node.js 22+, no package install needed)
- Cloudflare Worker: `npm run build` embeds web assets

## Run Locally

```bash
cp .env.example .env
npm start
# Open http://localhost:4173
```

Empty credentials produce a seeded demo. Set keys in `.env` for live mode:
- `ZOOWORK_API_KEY`: Shopper sessions and analysis
- `TAVILY_API_KEY`: Search-verified competitors and page context
- `BAND_API_KEY`: Focus group recording (agent key: `band_a_…`)
- `ZOOWORK_MODEL`: Defaults to `litellm/gpt-6-astra`
- `ZOOWORK_AGENT_ID`: Reuse one persistent agent (else creates temp agents)

## Recent Work

**Status**: live mode verified end to end against real ZooWork + Tavily.

**Report 502** (was: 100-shopper request exceeded the 120KB limit)
- Raised request limits 120KB → 1MB in `server.mjs` and `worker/index.js`
- Trimmed the frontend payload (dropped unused `merchantScore`)
- Verified live: 100 rows = 31KB, HTTP 200 in ~40s, 5 real recommendations

**Tavily `site:` operator is unreliable — use `include_domains`**
Tavily does not reliably honour `site:target.com` in the query string; it
returned Wiktionary/Apple/Merriam-Webster results, which the domain filter
then discarded, leaving the merchant with **zero** evidence pages while the
competitor got 7. `include_domains: [domain]` returns correct product pages
for both. `search()` now takes a `domains` argument. Do not reintroduce
`site:` in query text.

**Floor animation**
Personas never entered the stores because demo phase durations were 500ms —
far too short to walk there. Now 7s/7s/2.5s (demo) and 9s/18s (live), with
separate travel/browse speeds and a slow vertical sweep per aisle. Worker
starts are staggered so the floor fills continuously (demo pool 18, live 6).
Initial phase is now looked up by persona id, not `index < run.length`.

## Live timings (measured)

| Call | Latency |
|---|---|
| `/api/persona`, temp agent per call | ~96s |
| `/api/persona`, persistent `ZOOWORK_AGENT_ID` | ~47s |
| `/api/report`, 100 rows | ~40s |

Always set `ZOOWORK_AGENT_ID` — it halves per-shopper latency. A full
100-person run at 6 concurrent is ~13 min. Create one with
`POST /agents` (model + `tool_policy.allow: [web_search, web_fetch]`),
then `POST /agents/{id}/start`.

## Known gaps

- `BAND_CHAT_ID` is unset, so `/api/status` reports `band: false` and the
  focus group runs via ZooWork without being recorded in Band.
- `BAND_AGENT_ID` is present in `.env` but no code reads it; the Band
  adapter authenticates with `BAND_API_KEY` and targets `BAND_CHAT_ID`.
- Credentials were pasted into a chat session on 2026-10-03 — rotate the
  ZooWork, Tavily and Band keys after the hackathon.

## Key Files

- `web/app.js` (lines 29–39): Report generation, focus group, what-if
- `worker/index.js` (lines 5, 31): Request size check; analysis prompt formatting
- `server.mjs` (line 13): Node request size limit

## Testing

```bash
npm run check    # Syntax check all files
npm test         # API behavior tests
npm run build    # Build Cloudflare Worker
```

## Next Steps

1. ~~Fix report 502~~ done, verified live
2. ~~Smooth walking animations~~ done
3. Reduce "undecided" outcomes — have each shopper research its own goal
   and record a tentative preference when evidence supports it
4. Plan Cloudflare deployment with Wrangler
