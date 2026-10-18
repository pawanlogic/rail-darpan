const BASE = "https://api.railradar.in/v1";

async function call(path, apiKey, options = {}) {
  if (!apiKey) throw new Error("RAILRADAR_API_KEY is not configured");
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(options.query || {})) {
    if (v !== undefined && v !== "") url.searchParams.set(k, v);
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" }
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || data?.error || `Provider error (${res.status})`;
    const err = new Error(msg); err.status = res.status; throw err;
  }
  return data;
}

export const railradar = {
  stationSearch: (query, limit, key) => call("/lookup/search/stations", key, {query:{q:query, limit}}),
  pnr: (pnr, key) => call(`/pnr/${encodeURIComponent(pnr)}`, key),
  liveTrain: (number, date, key) => call(`/trains/${encodeURIComponent(number)}/live`, key, {query:{date}}),
  stationLive: (code, hours, key) => call(`/stations/${encodeURIComponent(code)}/live`, key, {query:{hours}}),
  between: (from, to, date, key) => call(`/trains/between/${encodeURIComponent(from)}/${encodeURIComponent(to)}`, key, {query:{date}}),
  seats: (number, query, key) => call(`/trains/${encodeURIComponent(number)}/seats`, key, {query}),
  schedule: (number, key) => call(`/trains/${encodeURIComponent(number)}`, key),
  fare: (number, query, key) => call(`/trains/${encodeURIComponent(number)}/fare`, key, {query})
};
