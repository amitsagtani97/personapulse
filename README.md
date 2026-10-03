# PersonaPulse

A demo-ready synthetic shopper panel for Target vs Walmart clothing. Ten seeded shoppers complete distinct missions, compare their experience, expose a replayable decision trace, discuss friction in a Band-style focus room, and test three merchandising changes.

## Run locally

Requires Node.js 20 or newer. No install step is needed.

```bash
cd personapulse
cp .env.example .env
npm start
```

Open <http://localhost:4173>. All features work with no API keys. Environment variables are read by the server only; do not put keys in `dist/` or commit `.env`.

## Demo script

1. **Overview:** Target wins 5 of 10 shoppers but loses on size availability and total basket value.
2. **Shopper runs:** Open Samira to replay where an unavailable size caused a Walmart choice. Open Leo to show where Target wins on style.
3. **Focus group:** Ask “Why did size and fit matter?” or “What about price?” The moderator, relevant shoppers, and analyst respond in a timestamped room.
4. **What-if test:** Select “Show available sizes on every card” and run the test. Show the projected confidence change and the specific shoppers it affects.

Scores, preferences, quotes, and scenario uplifts are illustrative seeded data. They are not measured conversion, current live product availability, or price claims.

## Sponsor adapters

| Sponsor | Role | Demo fallback | Optional live setup |
| --- | --- | --- | --- |
| ZooWork | Orchestrates shopper agent sessions | Seeded ten-person panel | Set `ZOOWORK_API_KEY` and `ZOOWORK_SESSION_ENDPOINT` |
| Tavily | Extracts web/product search context | Seeded comparison evidence | Set `TAVILY_API_KEY` |
| Band | Routes room questions to an addressed agent | Local timestamped focus room | Set `BAND_API_KEY`, `BAND_CHAT_ID`, `BAND_MENTION_ID`, `BAND_MENTION_HANDLE` |

The adapters are in `lib/adapters.mjs`. The browser only talks to `server.mjs` under `/api`; credentials never reach the browser. Tavily uses its Search API. Band uses its agent message endpoint with an explicit mention, consistent with its room routing model. For ZooWork, `ZOOWORK_SESSION_ENDPOINT` should point to your own thin bridge to the chosen Managed Agents API agent/session configuration. PersonaPulse posts `{mission, personas}` and expects JSON. This bridge avoids inventing an API version or agent identity before your ZooWork account is configured. The UI deliberately keeps seeded results when a provider is unavailable or times out, so a live stage demo remains operable.

The `dist/` directory is also a static, read-only demo build. It can be hosted without the Node server; browser requests to `/api` then fall back to the same seeded experience. Live sponsor calls require the local server or a deployed server equivalent.

## Project structure

```text
dist/index.html       App shell
dist/styles.css       Responsive interface
dist/data.js          Ten personas, replay events, and scenarios
dist/app.js           Dashboard and interaction views
lib/adapters.mjs      Sponsor-specific server adapters
server.mjs            Static server and secret-safe API routes
```

## Caveats for a real pilot

Validate shopper findings with real customer research and A/B tests. Replace seeded data with agent event output, normalize retrieved product data, and store room transcripts before presenting results as observed behavior. Check retailer terms and permitted data access before live site extraction.
