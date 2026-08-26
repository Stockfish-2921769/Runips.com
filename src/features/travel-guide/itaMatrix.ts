import type { FlightSegment } from './model';

interface ItaMatrixSearchInput {
  origin: string;
  destination: string;
  departureDate: string;
  routingCode?: string;
}

interface GoogleFlightsSearchInput {
  origin: string;
  destination: string;
  departureDate: string;
}

const ITA_MATRIX_HOME = 'https://matrix.itasoftware.com/search';

function normaliseFlightNumber(value: string) {
  const matches = [...value.toUpperCase().matchAll(/\b([A-Z0-9]{2})\s*(\d{1,4}[A-Z]?)\b/g)];
  const match = matches.at(-1);
  return match ? `${match[1]}${match[2]}` : 'F';
}

export function buildItaRoutingCode(segments: FlightSegment[]) {
  return segments.map((segment) => normaliseFlightNumber(segment.flightNumber)).join(' ');
}

export function buildItaMatrixUrl({ origin, destination, departureDate, routingCode = '' }: ItaMatrixSearchInput) {
  const payload = {
    type: 'one-way',
    slices: [
      {
        origin: [origin.trim().toUpperCase()],
        dest: [destination.trim().toUpperCase()],
        routingCode,
        extensionCodes: '',
        dates: {
          searchDateType: 'specific',
          departureDate,
          departureDateType: 'depart',
          departureDateModifier: '0',
          departureDatePreferredTimes: [],
        },
      },
    ],
    options: {
      cabin: 'COACH',
      stops: '-1',
      extraStops: '1',
      allowAirportChanges: 'true',
      showOnlyAvailable: 'true',
    },
    pax: { adults: '1' },
  };

  try {
    const encodedSearch = window.btoa(JSON.stringify(payload));
    return `${ITA_MATRIX_HOME}?search=${encodeURIComponent(encodedSearch)}`;
  } catch {
    return 'https://matrix.itasoftware.com/';
  }
}

export function buildGoogleFlightsFallbackUrl({ origin, destination, departureDate }: GoogleFlightsSearchInput) {
  const url = new URL('https://www.google.com/travel/flights');
  url.searchParams.set('hl', 'en');
  url.searchParams.set('curr', 'JPY');
  url.searchParams.set('q', `Flights from ${origin} to ${destination} on ${departureDate}`);
  return url.toString();
}
