const cache = new Map();
const inFlight = new Map();
const failures = new Map();

const stats = {
  hits: 0,
  misses: 0,
  coalesced: 0,
  staleFallbacks: 0,
  upstreamErrors: 0,
  cooldownBlocks: 0
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function getPolicy(req) {
  if (req.method !== "GET") return null;

  const path = (req.originalUrl || req.path).split("?")[0];


  if (path === "/api/train/search") {
    const query = String(req.query.q || "").trim().toLowerCase();
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    if (!query) return null;

    return {
      key: `train-search:${query}:${limit}`,
      ttl: 24 * 60 * 60 * 1000,
      stale: 7 * 24 * 60 * 60 * 1000
    };
  }

let match = path.match(/^\/api\/train\/(\d+)\/live$/);

  if (match) {
    const date = String(req.query.date || new Date().toISOString().slice(0, 10));

    return {
      key: `train-live:${match[1]}:${date}`,
      ttl: 45 * 1000,
      stale: 6 * HOUR
    };
  }

  match = path.match(/^\/api\/train\/(\d+)\/schedule$/);

  if (match) {
    return {
      key: `train-schedule:${match[1]}`,
      ttl: DAY,
      stale: 30 * DAY
    };
  }

  if (path === "/api/stations/search") {
    const query = String(req.query.q || "").trim().toLowerCase();

    if (query.length < 2) return null;

    return {
      key: `station-search:${query}`,
      ttl: 6 * HOUR,
      stale: 30 * DAY
    };
  }

  if (path === "/api/trains/between") {
    const from = String(req.query.from || "").trim().toUpperCase();
    const to = String(req.query.to || "").trim().toUpperCase();
    const date = String(req.query.date || "").trim();

    if (
      !/^[A-Z0-9]{2,10}$/.test(from) ||
      !/^[A-Z0-9]{2,10}$/.test(to) ||
      from === to ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return null;
    }

    return {
      key: `trains-between:${from}:${to}:${date}`,
      ttl: 15 * 60 * 1000,
      stale: 6 * HOUR
    };
  }

  match = path.match(/^\/api\/station\/([A-Z0-9]+)\/live$/i);

  if (match) {
    const code = match[1].toUpperCase();
    const hours = Math.min(24, Math.max(1, Number(req.query.hours) || 4));

    return {
      key: `station-live:${code}:${hours}`,
      ttl: 60 * 1000,
      stale: 6 * HOUR
    };
  }

  // RailKit lookup cache policies
  let lookupMatch = path.match(/^\/api\/lookup\/station\/([A-Z0-9]+)\/amenities$/i);
  if (lookupMatch) {
    return {
      key: `railkit-station-amenities:${lookupMatch[1].toUpperCase()}`,
      ttl: 7 * DAY,
      stale: 30 * DAY
    };
  }

  lookupMatch = path.match(/^\/api\/lookup\/station\/([A-Z0-9]+)$/i);
  if (lookupMatch) {
    return {
      key: `railkit-station:${lookupMatch[1].toUpperCase()}`,
      ttl: 30 * DAY,
      stale: 30 * DAY
    };
  }

  if (path === "/api/lookup/stations") {
    const name = String(req.query.name || "").trim().toLowerCase();
    if (name.length < 2) return null;
    return {
      key: `railkit-stations-name:${name}`,
      ttl: DAY,
      stale: 7 * DAY
    };
  }

  lookupMatch = path.match(/^\/api\/lookup\/train\/(\d+)$/);
  if (lookupMatch) {
    return {
      key: `railkit-train-number:${lookupMatch[1]}`,
      ttl: DAY,
      stale: 7 * DAY
    };
  }

  if (path === "/api/lookup/trains") {
    const name = String(req.query.name || "").trim().toLowerCase();
    if (name.length < 2) return null;
    return {
      key: `railkit-trains-name:${name}`,
      ttl: DAY,
      stale: 7 * DAY
    };
  }

  if (path === "/api/alerts") {
    return {
      key: "railway-alerts:all",
      ttl: 12 * HOUR,
      stale: 6 * HOUR
    };
  }

  if (path === "/api/news") {
    return {
      key: "railway-news",
      ttl: 10 * 60 * 1000,
      stale: 3 * DAY
    };
  }

  return null;
}

function copyBody(body) {
  try {
    return JSON.parse(JSON.stringify(body));
  } catch {
    return body;
  }
}

function isQuotaFailure(status, body) {
  const message =
    typeof body === "string"
      ? body
      : JSON.stringify(body || {});

  return (
    status === 402 ||
    status === 429 ||
    /monthly quota|quota exceeded|rate.?limit|too many requests|request limit|limit exceeded/i.test(message)
  );
}

function isUpstreamFailure(status, body) {
  return status >= 500 || isQuotaFailure(status, body);
}

function isSuccessfulBody(status, body) {
  if (status < 200 || status >= 300) return false;
  if (body && typeof body === "object") {
    if (body.error || body.success === false) return false;
  }
  return true;
}

function applyCacheHeaders(res, state, cachedAt) {
  res.setHeader("X-RailDarpan-Cache", state);

  if (cachedAt) {
    res.setHeader(
      "X-RailDarpan-Cached-At",
      new Date(cachedAt).toISOString()
    );
  }
}

function saveCache(key, entry) {
  const now = Date.now();

  for (const [existingKey, existingEntry] of cache.entries()) {
    if (existingEntry.staleUntil <= now) {
      cache.delete(existingKey);
    }
  }

  if (!cache.has(key) && cache.size >= 500) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }

  cache.set(key, entry);
}

export function getProviderCacheStats() {
  return {
    ...stats,
    entries: cache.size,
    pendingRequests: inFlight.size
  };
}

export function providerCache(req, res, next) {
  const policy = getPolicy(req);

  if (!policy) return next();

  const now = Date.now();
  const key = policy.key;

  let entry = cache.get(key);

  if (entry && entry.staleUntil <= now) {
    cache.delete(key);
    entry = null;
  }

  if (entry && entry.freshUntil > now) {
    stats.hits++;

    applyCacheHeaders(res, entry.fallbackState || "HIT", entry.cachedAt);

    return res.status(entry.status).json(copyBody(entry.body));
  }

  const failure = failures.get(key);

  if (failure) {
    if (failure.retryUntil > now) {
      stats.cooldownBlocks++;
      applyCacheHeaders(res, "COOLDOWN", failure.cachedAt);
      return res.status(failure.status).json(copyBody(failure.body));
    }

    failures.delete(key);
  }

  const existingFlight = inFlight.get(key);

  if (existingFlight) {
    stats.coalesced++;

    return existingFlight
      .then(result => {
        if (!result) return next();

        const state =
          result.cacheState === "MISS"
            ? "COALESCED"
            : result.cacheState;

        applyCacheHeaders(res, state, result.cachedAt);

        return res.status(result.status).json(copyBody(result.body));
      })
      .catch(next);
  }

  stats.misses++;

  let resolveFlight;

  const flight = new Promise(resolve => {
    resolveFlight = resolve;
  });

  inFlight.set(key, flight);

  let completed = false;

  function finish(result) {
    if (completed) return;

    completed = true;
    resolveFlight(result);

    if (inFlight.get(key) === flight) {
      inFlight.delete(key);
    }
  }

  const originalJson = res.json.bind(res);

  res.json = function (body) {
    const status = res.statusCode || 200;
    const completedAt = Date.now();

    if (isSuccessfulBody(status, body)) {
      const saved = {
        status,
        body: copyBody(body),
        cachedAt: completedAt,
        freshUntil: completedAt + policy.ttl,
        staleUntil: completedAt + policy.ttl + policy.stale
      };

      saveCache(key, saved);
      failures.delete(key);
      applyCacheHeaders(res, "MISS", saved.cachedAt);

      finish({
        status,
        body: saved.body,
        cacheState: "MISS",
        cachedAt: saved.cachedAt
      });

      return originalJson(body);
    }

    if (isUpstreamFailure(status, body)) {
      stats.upstreamErrors++;

      const staleEntry = cache.get(key);

      if (staleEntry && staleEntry.staleUntil > completedAt) {
        stats.staleFallbacks++;

        const quotaFailure = isQuotaFailure(status, body);
        const state = quotaFailure ? "STALE-QUOTA" : "STALE-ERROR";

        staleEntry.fallbackState = state;
        staleEntry.freshUntil = Math.min(
          staleEntry.staleUntil,
          completedAt + (quotaFailure ? 6 * HOUR : 60 * 1000)
        );

        res.statusCode = 200;

        applyCacheHeaders(res, state, staleEntry.cachedAt);

        finish({
          status: 200,
          body: staleEntry.body,
          cacheState: state,
          cachedAt: staleEntry.cachedAt
        });

        return originalJson(copyBody(staleEntry.body));
      }
    }

    if (isUpstreamFailure(status, body)) {
      const quotaFailure = isQuotaFailure(status, body);
      const retryDelay = quotaFailure ? 6 * HOUR : 60 * 1000;

      if (!failures.has(key) && failures.size >= 500) {
        const oldestFailure = failures.keys().next().value;
        if (oldestFailure) failures.delete(oldestFailure);
      }

      failures.set(key, {
        status,
        body: copyBody(body),
        cachedAt: completedAt,
        retryUntil: completedAt + retryDelay
      });
    }

    applyCacheHeaders(res, "ERROR", null);

    finish({
      status,
      body: copyBody(body),
      cacheState: "ERROR",
      cachedAt: null
    });

    return originalJson(body);
  };

  res.on("close", () => {
    finish(null);
  });

  return next();
}
