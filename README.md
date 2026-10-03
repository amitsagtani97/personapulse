# PersonaPulse

A live synthetic shopper panel for testing a product or store against a relevant competitor. Enter a public URL and buying question, review verified competitor suggestions, launch 100 shopper personas, and inspect segment-level recommendations, replays, a focus group, and a what-if assessment.

## Run locally

Requires Node.js 22 or newer. No package install is required.

```bash
cp .env.example .env
npm start
```

Open <http://localhost:4173>. Empty credentials produce a clearly labeled seeded demo. Use `npm run check`, `npm test`, and `npm run build` to verify and package the Cloudflare-compatible Worker.

## Live sponsor setup

Add the keys to the **server-side** `.env` file locally or the Site's secret environment variables when hosted:

- `ZOOWORK_API_KEY`: shopper sessions, competitor selection, report synthesis, focus group moderation, and what-if analysis.
- `TAVILY_API_KEY`: current public search results for competitor verification and product context.
- `BAND_API_KEY`: an **agent** key (`band_a_…`) for recording the focus group in Band. A Band user key uses different API routes.

The default ZooWork model is `litellm/gpt-6-astra`, which was available in the connected model catalog. Set `ZOOWORK_MODEL` to another catalog ID if needed. For a 100-person run, provision one ZooWork agent with `web_search` and `web_fetch` and set `ZOOWORK_AGENT_ID`; otherwise the server creates a temporary agent per API call. The browser launches up to six independent shopper sessions at once, retries transient provider errors, and saves partial reports locally so a run can resume.

To connect a Band room, set `BAND_CHAT_ID`. For the room to send the transcript to its owner, also set `BAND_OWNER_ID`, `BAND_OWNER_HANDLE`, and `BAND_OWNER_NAME`. The focus group itself is moderated by ZooWork from completed shopper findings. The Band agent records the discussion as an event and routes a transcript message to the configured room participant. This adapter does not claim that 100 independent Band agents are running.

Do not place credentials in `web/`, commit `.env`, or paste keys into a URL. If a key has been exposed in chat or another shared surface, rotate it after setup.

## Demo flow

1. Enter a product/category URL and a precise customer question.
2. Review the competitor shortlist. In live mode, ZooWork proposes actual sellers and Tavily verifies their public domains.
3. Launch the 100-person panel. The animated floor follows session state and shows failures for retry.
4. Read the comparison report, segment counts, individual source-linked replays, focus group, and what-if assessment.

Shopper scores and recommendations are **synthetic research hypotheses**, not measured conversion or revenue lift. Validate changes with real customers and experiments. Public retailer pages may be blocked or incomplete; the agents are instructed to disclose uncertainty.

## Structure

- `web/app.js`: study flow, persona generation, 100-shopper canvas scene, report UI
- `web/styles.css`: responsive visual system
- `worker/index.js`: URL validation, ZooWork, Tavily, and Band adapters
- `server.mjs`: local Node host for the same API
- `scripts/build.mjs`: embeds web assets in the deployable Worker
- `tests/`: API behavior and provider adapter tests

## API references

- [ZooWork Managed Agents](https://zoowork.ai/docs/en/get-started/quickstart)
- [Tavily Search](https://docs.tavily.com/documentation/api-reference/endpoint/search)
- [Band Agent API](https://docs.band.ai/api/agent-api)
