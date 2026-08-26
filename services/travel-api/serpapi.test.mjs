import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSerpApiUrl,
  groupFlightOffers,
  normaliseSerpApiResponse,
  TravelApiError,
  validateSearchInput,
} from './serpapi.mjs';

const query = { origin: 'PEK', destination: 'FUK', departureDate: '2026-09-20' };

function segment(from, to, departure, arrival, flightNumber, airline = 'Example Air') {
  return {
    departure_airport: { id: from, name: `${from} Airport`, time: departure },
    arrival_airport: { id: to, name: `${to} Airport`, time: arrival },
    duration: 120,
    airplane: 'Boeing 787-9',
    airline,
    travel_class: 'Economy',
    flight_number: flightNumber,
  };
}

function offer(price, flights, layovers = [], totalDuration = 300) {
  return { price, flights, layovers, total_duration: totalDuration };
}

test('validates and normalises a supported search', () => {
  assert.deepEqual(
    validateSearchInput(
      { origin: ' pek ', destination: 'fuk', departureDate: '2026-09-20', ignored: 'value' },
      { today: '2026-08-26' },
    ),
    query,
  );
});

test('rejects unsupported destinations and past dates', () => {
  assert.throws(
    () => validateSearchInput({ ...query, destination: 'HND' }, { today: '2026-08-26' }),
    (error) => error instanceof TravelApiError && error.code === 'INVALID_DESTINATION',
  );
  assert.throws(
    () => validateSearchInput({ ...query, departureDate: '2026-08-25' }, { today: '2026-08-26' }),
    (error) => error instanceof TravelApiError && error.code === 'PAST_DATE',
  );
});

test('builds a one-way, economy Google Flights provider request', () => {
  const url = buildSerpApiUrl(query, { apiKey: 'test-key', noCache: true });
  assert.equal(url.origin, 'https://serpapi.com');
  assert.equal(url.searchParams.get('engine'), 'google_flights');
  assert.equal(url.searchParams.get('type'), '2');
  assert.equal(url.searchParams.get('travel_class'), '1');
  assert.equal(url.searchParams.get('currency'), 'JPY');
  assert.equal(url.searchParams.get('deep_search'), 'true');
  assert.equal(url.searchParams.get('no_cache'), 'true');
});

test('groups real offers by ordered connection pattern and keeps the cheapest in each group', () => {
  const directExpensive = offer(40_000, [segment('PEK', 'FUK', '2026-09-20 09:00', '2026-09-20 12:30', 'CA 953')], [], 210);
  const directCheap = offer(35_000, [segment('PEK', 'FUK', '2026-09-20 16:00', '2026-09-20 19:30', 'CA 955')], [], 210);
  const viaIcn = offer(
    28_000,
    [
      segment('PEK', 'ICN', '2026-09-20 08:00', '2026-09-20 11:00', 'KE 860', 'Korean Air'),
      segment('ICN', 'FUK', '2026-09-20 13:00', '2026-09-20 14:25', 'KE 789', 'Korean Air'),
    ],
    [{ id: 'ICN', name: 'Incheon International Airport', duration: 120 }],
    385,
  );
  const viaHnd = offer(
    30_000,
    [
      segment('PEK', 'HND', '2026-09-20 09:00', '2026-09-20 13:30', 'NH 962', 'ANA'),
      segment('HND', 'FUK', '2026-09-20 16:00', '2026-09-20 17:55', 'NH 263', 'ANA'),
    ],
    [{ id: 'HND', name: 'Haneda Airport', duration: 150 }],
    535,
  );

  const result = normaliseSerpApiResponse(
    {
      search_metadata: {
        created_at: '2026-08-26 10:00:00 UTC',
        google_flights_url: 'https://www.google.com/travel/flights?hl=en&curr=JPY',
      },
      search_parameters: { currency: 'JPY' },
      best_flights: [directExpensive, viaIcn],
      other_flights: [directCheap, viaHnd],
      price_insights: { lowest_price: 28_000, price_level: 'low' },
    },
    query,
    '2026-08-26T10:00:02.000Z',
  );

  assert.equal(result.offerCount, 4);
  assert.equal(result.routeGroups.length, 3);
  assert.equal(result.routeGroups[0].kind, 'direct');
  assert.equal(result.routeGroups[0].cheapestOffer.price.amount, 35_000);
  assert.deepEqual(result.routeGroups[1].connectionCodes, ['ICN']);
  assert.equal(result.routeGroups[1].cheapestOffer.segments[1].flightNumber, 'KE 789');
  assert.deepEqual(result.routeGroups[2].connectionCodes, ['HND']);
  assert.equal(result.googleFlightsUrl, 'https://www.google.com/travel/flights?hl=en&curr=JPY');
});

test('drops offers for a different airport pair', () => {
  const raw = {
    search_parameters: { currency: 'JPY' },
    other_flights: [offer(10_000, [segment('PKX', 'FUK', '2026-09-20 09:00', '2026-09-20 12:30', 'XX 1')])],
  };
  assert.equal(normaliseSerpApiResponse(raw, query).offerCount, 0);
});

test('group helper retains direct-first ordering', () => {
  const base = {
    id: 'one-0',
    price: { amount: 10, currency: 'JPY' },
    totalDurationMinutes: 100,
    segments: [],
    extensions: [],
  };
  const groups = groupFlightOffers([
    { ...base, id: 'connection-0', layovers: [{ code: 'ICN' }] },
    { ...base, id: 'direct-0', price: { amount: 20, currency: 'JPY' }, layovers: [] },
  ]);
  assert.equal(groups[0].kind, 'direct');
});
