const timeoutFetch = async (url, options = {}) => {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error(`Sponsor request failed (${response.status})`);
  return response.json();
};

export const tavily = {
  name: 'Tavily',
  available: () => Boolean(process.env.TAVILY_API_KEY),
  async extract(query) {
    if (!this.available()) return { mode: 'demo', results: [] };
    const data = await timeoutFetch('https://api.tavily.com/search', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query, search_depth: 'basic', max_results: 5, include_answer: false })
    });
    return { mode: 'live', results: (data.results || []).map(({ title, url, content }) => ({ title, url, content })) };
  }
};

// ZooWork's agent/session/event contract is implemented by the configured bridge.
// This keeps provider credentials and API versions entirely server-side.
export const zoowork = {
  name: 'ZooWork',
  available: () => Boolean(process.env.ZOOWORK_API_KEY && process.env.ZOOWORK_SESSION_ENDPOINT),
  async run(payload) {
    if (!this.available()) return { mode: 'demo' };
    const data = await timeoutFetch(process.env.ZOOWORK_SESSION_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.ZOOWORK_API_KEY}` },
      body: JSON.stringify(payload)
    });
    return { mode: 'live', data };
  }
};

export const band = {
  name: 'Band',
  available: () => Boolean(process.env.BAND_API_KEY && process.env.BAND_CHAT_ID && process.env.BAND_MENTION_ID && process.env.BAND_MENTION_HANDLE),
  async send(content) {
    if (!this.available()) return { mode: 'demo' };
    const handle = process.env.BAND_MENTION_HANDLE;
    const data = await timeoutFetch(`https://app.band.ai/api/v1/agent/chats/${encodeURIComponent(process.env.BAND_CHAT_ID)}/messages`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': process.env.BAND_API_KEY },
      body: JSON.stringify({ message: { content: `@${handle} ${content}`, mentions: [{ id: process.env.BAND_MENTION_ID, name: handle, handle }] } })
    });
    return { mode: 'live', data };
  }
};
