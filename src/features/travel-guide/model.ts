export type TravelLanguage = 'en' | 'zh';

export type DestinationCode = 'FUK' | 'KKJ';
export type TicketArrangement = 'single' | 'separate' | 'unknown';
export type BaggageArrangement = 'through' | 'collect' | 'cabin-only' | 'unknown';

export interface LocalisedText {
  en: string;
  zh: string;
}

export interface Airport {
  code: string;
  city: LocalisedText;
  name: LocalisedText;
  countryCode: string;
  latitude: number;
  longitude: number;
  approximate?: boolean;
}

export interface FlightAirportRef {
  code: string;
  name: string;
  localTime: string;
}

export interface FlightSegment {
  id: string;
  departureAirport: FlightAirportRef;
  arrivalAirport: FlightAirportRef;
  durationMinutes: number;
  airline: string;
  flightNumber: string;
  aircraft: string;
  travelClass: string;
  overnight: boolean;
  oftenDelayed: boolean;
  operatedBy: string;
}

export interface FlightLayover {
  code: string;
  name: string;
  durationMinutes: number;
  overnight: boolean;
}

export interface FlightOffer {
  id: string;
  price: {
    amount: number;
    currency: string;
  };
  totalDurationMinutes: number;
  segments: FlightSegment[];
  layovers: FlightLayover[];
  extensions: string[];
}

export interface FlightRouteGroup {
  id: string;
  kind: 'direct' | 'connection';
  connectionCodes: string[];
  cheapestOffer: FlightOffer;
  alternativeCount: number;
}

export interface FlightSearchResponse {
  query: {
    origin: string;
    destination: DestinationCode;
    departureDate: string;
    currency: string;
    travelClass: string;
  };
  checkedAt: string;
  providerFetchedAt: string;
  googleFlightsUrl: string;
  routeGroups: FlightRouteGroup[];
  offerCount: number;
  priceInsights: {
    lowestPrice: number;
    priceLevel: string;
  } | null;
  source: string;
  cache: {
    hit: boolean;
    ageSeconds: number;
    ttlSeconds: number;
  };
}

export interface TravelSearch {
  origin: string;
  destination: DestinationCode;
  departureDate: string;
  passportCountry: string;
  ticketArrangement: TicketArrangement;
  baggageArrangement: BaggageArrangement;
}

export interface Connection {
  airport: Airport;
  durationMinutes: number;
  overnight: boolean;
}

export function localise(text: LocalisedText, language: TravelLanguage) {
  return text[language];
}

export function routeCodes(offer: FlightOffer) {
  if (offer.segments.length === 0) return [];
  return [offer.segments[0].departureAirport.code, ...offer.segments.map((segment) => segment.arrivalAirport.code)];
}

export function formatDuration(minutes: number, language: TravelLanguage) {
  if (!Number.isFinite(minutes) || minutes <= 0) return language === 'zh' ? '时长未提供' : 'Duration not supplied';
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (language === 'zh') return `${hours > 0 ? `${hours}小时` : ''}${remaining > 0 ? `${remaining}分` : ''}`;
  return `${hours > 0 ? `${hours}h ` : ''}${remaining > 0 ? `${remaining}m` : ''}`.trim();
}

export function formatPrice(amount: number, currency: string, language: TravelLanguage) {
  return new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
