import { createHash } from 'node:crypto';

const IATA_CODE = /^[A-Z]{3}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_UPSTREAM_BYTES = 8 * 1024 * 1024;

export class TravelApiError extends Error {
  constructor(status, code, message, options = {}) {
    super(message, options);
    this.name = 'TravelApiError';
    this.status = status;
    this.code = code;
    this.retryAfter = options.retryAfter;
  }
}

function cleanString(value, fallback = '', maxLength = 180) {
  if (typeof value !== 'string') return fallback;
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function cleanCode(value) {
  const code = cleanString(value, '', 3).toUpperCase();
  return IATA_CODE.test(code) ? code : '';
}

function integer(value, fallback = 0) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : fallback;
}

function boolean(value) {
  return value === true;
}

function japaneseToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(isoDate, days) {
  const value = new Date(`${isoDate}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function validateSearchInput(raw, options = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new TravelApiError(400, 'INVALID_REQUEST', 'Send a JSON object containing origin, destination and departureDate.');
  }

  const origin = cleanString(raw.origin, '', 3).toUpperCase();
  const destination = cleanString(raw.destination, '', 3).toUpperCase();
  const departureDate = cleanString(raw.departureDate, '', 10);
  const allowedDestinations = new Set(options.allowedDestinations ?? ['FUK', 'KKJ']);
  const today = options.today ?? japaneseToday();
  const latestDate = addDays(today, options.maxAdvanceDays ?? 365);

  if (!IATA_CODE.test(origin)) {
    throw new TravelApiError(400, 'INVALID_ORIGIN', 'Origin must be a three-letter IATA airport code.');
  }
  if (!IATA_CODE.test(destination) || !allowedDestinations.has(destination)) {
    throw new TravelApiError(400, 'INVALID_DESTINATION', 'Destination must be FUK or KKJ.');
  }
  if (origin === destination) {
    throw new TravelApiError(400, 'SAME_AIRPORT', 'Origin and destination must be different airports.');
  }
  if (!ISO_DATE.test(departureDate) || Number.isNaN(Date.parse(`${departureDate}T00:00:00Z`))) {
    throw new TravelApiError(400, 'INVALID_DATE', 'Departure date must use YYYY-MM-DD.');
  }
  if (departureDate < today) {
    throw new TravelApiError(400, 'PAST_DATE', 'Departure date cannot be in the past.');
  }
  if (departureDate > latestDate) {
    throw new TravelApiError(400, 'DATE_TOO_FAR', 'Departure date must be within the next 365 days.');
  }

  return { origin, destination, departureDate };
}

function normaliseAirport(raw) {
  const code = cleanCode(raw?.id);
  if (!code) return null;
  return {
    code,
    name: cleanString(raw?.name, code),
    localTime: cleanString(raw?.time, '', 32),
  };
}

function normaliseSegment(raw, index) {
  const departureAirport = normaliseAirport(raw?.departure_airport);
  const arrivalAirport = normaliseAirport(raw?.arrival_airport);
  if (!departureAirport || !arrivalAirport) return null;

  return {
    id: `${index + 1}-${departureAirport.code}-${arrivalAirport.code}`,
    departureAirport,
    arrivalAirport,
    durationMinutes: integer(raw?.duration),
    airline: cleanString(raw?.airline, 'Airline not supplied'),
    flightNumber: cleanString(raw?.flight_number, 'Not supplied', 24),
    aircraft: cleanString(raw?.airplane, 'Not supplied'),
    travelClass: cleanString(raw?.travel_class, 'Economy', 48),
    overnight: boolean(raw?.overnight),
    oftenDelayed: boolean(raw?.often_delayed_by_over_30_min),
    operatedBy: cleanString(raw?.plane_and_crew_by, '', 180),
  };
}

function normaliseLayovers(rawLayovers, segments) {
  if (Array.isArray(rawLayovers) && rawLayovers.length > 0) {
    return rawLayovers
      .map((layover) => {
        const code = cleanCode(layover?.id);
        if (!code) return null;
        return {
          code,
          name: cleanString(layover?.name, code),
          durationMinutes: integer(layover?.duration),
          overnight: boolean(layover?.overnight),
        };
      })
      .filter(Boolean);
  }

  return segments.slice(0, -1).map((segment) => ({
    code: segment.arrivalAirport.code,
    name: segment.arrivalAirport.name,
    durationMinutes: 0,
    overnight: false,
  }));
}

function offerFingerprint(segments) {
  const value = segments
    .map((segment) => [
      segment.flightNumber,
      segment.departureAirport.code,
      segment.departureAirport.localTime,
      segment.arrivalAirport.code,
      segment.arrivalAirport.localTime,
    ].join('|'))
    .join('>');
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

function normaliseOffer(raw, index, query, currency) {
  if (!raw || !Array.isArray(raw.flights) || raw.flights.length === 0 || !Number.isFinite(raw.price)) return null;
  const segments = raw.flights.map(normaliseSegment).filter(Boolean);
  if (segments.length !== raw.flights.length || segments.length === 0) return null;
  if (segments[0].departureAirport.code !== query.origin) return null;
  if (segments.at(-1).arrivalAirport.code !== query.destination) return null;

  const layovers = normaliseLayovers(raw.layovers, segments);
  const extensions = Array.isArray(raw.extensions)
    ? raw.extensions.map((item) => cleanString(item, '', 120)).filter(Boolean).slice(0, 8)
    : [];

  return {
    id: `${offerFingerprint(segments)}-${index}`,
    price: {
      amount: integer(raw.price),
      currency,
    },
    totalDurationMinutes: integer(raw.total_duration, segments.reduce((sum, segment) => sum + segment.durationMinutes, 0)),
    segments,
    layovers,
    extensions,
  };
}

export function groupFlightOffers(offers, maxGroups = 8) {
  const uniqueOffers = new Map();
  for (const offer of offers) {
    const fingerprint = offer.id.split('-').slice(0, -1).join('-');
    const existing = uniqueOffers.get(fingerprint);
    if (!existing || offer.price.amount < existing.price.amount) uniqueOffers.set(fingerprint, offer);
  }

  const grouped = new Map();
  for (const offer of uniqueOffers.values()) {
    const connectionCodes = offer.layovers.map((layover) => layover.code);
    const signature = connectionCodes.length === 0 ? 'DIRECT' : connectionCodes.join('>');
    const existing = grouped.get(signature);
    if (!existing) {
      grouped.set(signature, {
        id: signature.toLowerCase().replaceAll('>', '-'),
        kind: signature === 'DIRECT' ? 'direct' : 'connection',
        connectionCodes,
        cheapestOffer: offer,
        alternativeCount: 1,
      });
      continue;
    }

    existing.alternativeCount += 1;
    const current = existing.cheapestOffer;
    if (
      offer.price.amount < current.price.amount ||
      (offer.price.amount === current.price.amount && offer.totalDurationMinutes < current.totalDurationMinutes)
    ) {
      existing.cheapestOffer = offer;
    }
  }

  return [...grouped.values()]
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'direct' ? -1 : 1;
      if (a.cheapestOffer.price.amount !== b.cheapestOffer.price.amount) {
        return a.cheapestOffer.price.amount - b.cheapestOffer.price.amount;
      }
      return a.cheapestOffer.totalDurationMinutes - b.cheapestOffer.totalDurationMinutes;
    })
    .slice(0, maxGroups);
}

function safeGoogleFlightsUrl(value) {
  const candidate = cleanString(value, '', 4000);
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === 'https:' && /(^|\.)google\.com$/.test(parsed.hostname)) return parsed.toString();
  } catch {
    // Fall through to an empty URL; the frontend will use the generic Google Flights page.
  }
  return '';
}

function providerTimestamp(value, fallback) {
  const parsed = Date.parse(cleanString(value, '', 64));
  return Number.isNaN(parsed) ? fallback : new Date(parsed).toISOString();
}

export function normaliseSerpApiResponse(raw, query, checkedAt = new Date().toISOString()) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new TravelApiError(502, 'INVALID_PROVIDER_RESPONSE', 'The flight provider returned an invalid response.');
  }
  if (typeof raw.error === 'string' && raw.error.trim()) {
    throw new TravelApiError(503, 'PROVIDER_ERROR', 'The flight provider could not complete this search.');
  }

  const currency = cleanString(raw.search_parameters?.currency, 'JPY', 3).toUpperCase() || 'JPY';
  const candidates = [
    ...(Array.isArray(raw.best_flights) ? raw.best_flights : []),
    ...(Array.isArray(raw.other_flights) ? raw.other_flights : []),
  ];
  const offers = candidates.map((offer, index) => normaliseOffer(offer, index, query, currency)).filter(Boolean);
  const routeGroups = groupFlightOffers(offers);

  return {
    query: { ...query, currency, travelClass: 'Economy' },
    checkedAt,
    providerFetchedAt: providerTimestamp(raw.search_metadata?.created_at, checkedAt),
    googleFlightsUrl: safeGoogleFlightsUrl(raw.search_metadata?.google_flights_url),
    routeGroups,
    offerCount: offers.length,
    priceInsights: Number.isFinite(raw.price_insights?.lowest_price)
      ? {
          lowestPrice: integer(raw.price_insights.lowest_price),
          priceLevel: cleanString(raw.price_insights?.price_level, '', 48),
        }
      : null,
    source: 'SerpApi Google Flights API',
  };
}

export function buildSerpApiUrl(query, options) {
  const url = new URL('https://serpapi.com/search.json');
  const parameters = {
    engine: 'google_flights',
    departure_id: query.origin,
    arrival_id: query.destination,
    outbound_date: query.departureDate,
    type: '2',
    travel_class: '1',
    currency: 'JPY',
    gl: 'jp',
    hl: 'en',
    deep_search: 'true',
    show_hidden: 'true',
    api_key: options.apiKey,
  };
  for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, value);
  if (options.noCache === true) url.searchParams.set('no_cache', 'true');
  return url;
}

export async function searchSerpApi(query, options) {
  const url = buildSerpApiUrl(query, options);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 45_000);
  let response;

  try {
    response = await (options.fetchImpl ?? fetch)(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'RunIPS-Travel-Guide/1.0' },
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new TravelApiError(504, 'PROVIDER_TIMEOUT', 'The flight search took too long. Please try again.');
    }
    throw new TravelApiError(503, 'PROVIDER_UNAVAILABLE', 'The flight provider is temporarily unavailable.', { cause: error });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new TravelApiError(503, 'PROVIDER_LIMIT', 'The live-search allowance is temporarily exhausted.');
    }
    throw new TravelApiError(503, 'PROVIDER_UNAVAILABLE', 'The flight provider is temporarily unavailable.');
  }

  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_UPSTREAM_BYTES) {
    throw new TravelApiError(502, 'PROVIDER_RESPONSE_TOO_LARGE', 'The flight provider returned too much data.');
  }

  const body = await response.text();
  if (body.length > MAX_UPSTREAM_BYTES) {
    throw new TravelApiError(502, 'PROVIDER_RESPONSE_TOO_LARGE', 'The flight provider returned too much data.');
  }

  let raw;
  try {
    raw = JSON.parse(body);
  } catch (error) {
    throw new TravelApiError(502, 'INVALID_PROVIDER_RESPONSE', 'The flight provider returned invalid JSON.', { cause: error });
  }

  return normaliseSerpApiResponse(raw, query);
}
