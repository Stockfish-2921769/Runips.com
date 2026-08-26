import http from 'node:http';
import { searchSerpApi, TravelApiError, validateSearchInput } from './serpapi.mjs';

const apiKey = process.env.SERPAPI_API_KEY?.trim();
const host = process.env.TRAVEL_API_HOST?.trim() || '127.0.0.1';
const port = parseInteger(process.env.TRAVEL_API_PORT, 18_010, 1, 65_535);
const cacheTtlMs = parseInteger(process.env.TRAVEL_CACHE_TTL_MS, 10 * 60_000, 10_000, 60 * 60_000);
const providerTimeoutMs = parseInteger(process.env.TRAVEL_UPSTREAM_TIMEOUT_MS, 45_000, 5_000, 90_000);
const requestLimit = parseInteger(process.env.TRAVEL_REQUEST_LIMIT_PER_10_MIN, 60, 5, 600);
const upstreamIpLimit = parseInteger(process.env.TRAVEL_UPSTREAM_LIMIT_PER_HOUR, 8, 1, 100);
const upstreamDailyLimit = parseInteger(process.env.TRAVEL_UPSTREAM_DAILY_LIMIT, 40, 1, 1_000);
const providerNoCache = process.env.TRAVEL_PROVIDER_NO_CACHE === 'true';
const allowedDestinations = (process.env.TRAVEL_ALLOWED_DESTINATIONS || 'FUK,KKJ')
  .split(',')
  .map((value) => value.trim().toUpperCase())
  .filter(Boolean);
const allowedOrigins = new Set(
  (process.env.TRAVEL_ALLOWED_ORIGINS || 'https://runips.43.159.51.15.sslip.io,http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);

if (!apiKey) {
  console.error('SERPAPI_API_KEY is required.');
  process.exit(1);
}

const resultCache = new Map();
const inFlight = new Map();
const requestWindows = new Map();
const upstreamWindows = new Map();
let globalUpstreamWindow = { startedAt: Date.now(), count: 0 };

function parseInteger(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

function headers(extra = {}) {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    ...extra,
  };
}

function sendJson(response, status, payload, extraHeaders = {}) {
  response.writeHead(status, headers(extraHeaders));
  response.end(JSON.stringify(payload));
}

function sendEmpty(response, status, extraHeaders = {}) {
  response.writeHead(status, { 'Cache-Control': 'no-store', ...extraHeaders });
  response.end();
}

function corsHeaders(request) {
  const origin = request.headers.origin;
  if (!origin || !allowedOrigins.has(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    Vary: 'Origin',
  };
}

function clientKey(request) {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim().slice(0, 80);
  return request.socket.remoteAddress?.slice(0, 80) || 'unknown';
}

function consumeWindowQuota(store, key, durationMs, limit) {
  const now = Date.now();
  const current = store.get(key);
  if (!current || now - current.startedAt >= durationMs) {
    store.set(key, { startedAt: now, count: 1 });
    return { allowed: true, retryAfter: 0 };
  }
  if (current.count >= limit) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((durationMs - (now - current.startedAt)) / 1000)) };
  }
  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function consumeGlobalUpstreamBudget() {
  const now = Date.now();
  const durationMs = 24 * 60 * 60_000;
  if (now - globalUpstreamWindow.startedAt >= durationMs) {
    globalUpstreamWindow = { startedAt: now, count: 1 };
    return { allowed: true, retryAfter: 0 };
  }
  if (globalUpstreamWindow.count >= upstreamDailyLimit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((durationMs - (now - globalUpstreamWindow.startedAt)) / 1000)),
    };
  }
  globalUpstreamWindow.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let rejected = false;
    request.on('data', (chunk) => {
      if (rejected) return;
      size += chunk.length;
      if (size > 4_096) {
        rejected = true;
        reject(new TravelApiError(413, 'REQUEST_TOO_LARGE', 'The search request is too large.'));
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (rejected) return;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (error) {
        reject(new TravelApiError(400, 'INVALID_JSON', 'Send valid JSON.', { cause: error }));
      }
    });
    request.on('error', reject);
  });
}

function cacheKey(query) {
  return `${query.origin}:${query.destination}:${query.departureDate}:JPY:ECONOMY`;
}

function cachedResult(key) {
  const entry = resultCache.get(key);
  if (!entry) return null;
  const ageMs = Date.now() - entry.storedAt;
  if (ageMs >= cacheTtlMs) {
    resultCache.delete(key);
    return null;
  }
  return { value: entry.value, ageMs };
}

async function liveSearch(query, key) {
  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = searchSerpApi(query, {
    apiKey,
    timeoutMs: providerTimeoutMs,
    noCache: providerNoCache,
  })
    .then((value) => {
      resultCache.set(key, { value, storedAt: Date.now() });
      return value;
    })
    .finally(() => inFlight.delete(key));

  inFlight.set(key, promise);
  return promise;
}

function responsePayload(value, cacheHit, ageMs = 0) {
  return {
    ...value,
    cache: {
      hit: cacheHit,
      ageSeconds: Math.max(0, Math.floor(ageMs / 1000)),
      ttlSeconds: Math.floor(cacheTtlMs / 1000),
    },
  };
}

async function handleSearch(request, response) {
  const requestCors = corsHeaders(request);
  const requestRate = consumeWindowQuota(requestWindows, clientKey(request), 10 * 60_000, requestLimit);
  if (!requestRate.allowed) {
    sendJson(response, 429, { error: { code: 'RATE_LIMITED', message: 'Too many searches. Please wait before trying again.' } }, {
      ...requestCors,
      'Retry-After': String(requestRate.retryAfter),
    });
    return;
  }

  const body = await readJson(request);
  const query = validateSearchInput(body, { allowedDestinations });
  const key = cacheKey(query);
  const cached = cachedResult(key);
  if (cached) {
    sendJson(response, 200, responsePayload(cached.value, true, cached.ageMs), requestCors);
    return;
  }

  if (!inFlight.has(key)) {
    const upstreamRate = consumeWindowQuota(upstreamWindows, clientKey(request), 60 * 60_000, upstreamIpLimit);
    if (!upstreamRate.allowed) {
      throw new TravelApiError(429, 'LIVE_SEARCH_LIMITED', 'The live-search limit has been reached for this connection.', {
        retryAfter: upstreamRate.retryAfter,
      });
    }
    const globalBudget = consumeGlobalUpstreamBudget();
    if (!globalBudget.allowed) {
      throw new TravelApiError(503, 'DAILY_SEARCH_LIMIT', 'Today’s shared live-search allowance has been reached.', {
        retryAfter: globalBudget.retryAfter,
      });
    }
  }

  const value = await liveSearch(query, key);
  sendJson(response, 200, responsePayload(value, false), requestCors);
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  const requestCors = corsHeaders(request);

  if (request.method === 'OPTIONS' && url.pathname === '/v1/search') {
    if (request.headers.origin && !allowedOrigins.has(request.headers.origin)) {
      sendJson(response, 403, { error: { code: 'ORIGIN_NOT_ALLOWED', message: 'This origin is not allowed.' } });
      return;
    }
    sendEmpty(response, 204, {
      ...requestCors,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '600',
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/health') {
    sendJson(response, 200, {
      status: 'ok',
      service: 'runips-travel-api',
      providerConfigured: true,
      now: new Date().toISOString(),
    });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/v1/search') {
    try {
      await handleSearch(request, response);
    } catch (error) {
      if (response.headersSent) return;
      const known = error instanceof TravelApiError;
      const status = known ? error.status : 500;
      const code = known ? error.code : 'INTERNAL_ERROR';
      const message = known ? error.message : 'The flight search could not be completed.';
      const extraHeaders = { ...requestCors };
      if (known && error.retryAfter) extraHeaders['Retry-After'] = String(error.retryAfter);
      if (!known) console.error('Unexpected travel API error.');
      sendJson(response, status, { error: { code, message } }, extraHeaders);
    }
    return;
  }

  sendJson(response, 404, { error: { code: 'NOT_FOUND', message: 'Not found.' } }, requestCors);
});

server.requestTimeout = 60_000;
server.headersTimeout = 65_000;
server.keepAliveTimeout = 5_000;

server.listen(port, host, () => {
  console.log(`RunIPS Travel API listening on ${host}:${port}.`);
});

function shutDown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);
