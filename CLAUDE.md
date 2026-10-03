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

**Status**: ✓ Report 502 error fixed and verified.

**Problem** (commit 5105775): 100-shopper report request exceeded 120KB limit → 502 error.

**Solution** (commit ce8bfb0):
- Increased request size limits from 120KB → 1MB in both `server.mjs` and `worker/index.js`
- Trimmed frontend payload: removed unused `merchantScore` field from report data
- Verified with full 100-persona payload (28KB actual size) — no 502 error

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

1. Fix report 502 by trimming request fields and/or raising size limits
2. Verify with 10-shopper test run
3. Reduce "undecided" outcomes by refining shopper decision logic
4. Smooth walking animations
5. Plan Cloudflare deployment with Wrangler
