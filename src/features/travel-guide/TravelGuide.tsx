'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/i18n/LanguageProvider';
import { AIRPORT_SUGGESTIONS } from './airports';
import { travelCopy } from './copy';
import FlightRouteExplorer from './FlightRouteExplorer';
import TransitDocumentChecker from './TransitDocumentChecker';
import type {
  BaggageArrangement,
  DestinationCode,
  FlightSearchResponse,
  TicketArrangement,
  TravelLanguage,
  TravelSearch,
} from './model';

const INITIAL_SEARCH: TravelSearch = {
  origin: 'PEK',
  destination: 'FUK',
  departureDate: '',
  passportCountry: '',
  ticketArrangement: 'unknown',
  baggageArrangement: 'unknown',
};

const API_ENDPOINT = process.env.NEXT_PUBLIC_TRAVEL_API_URL || '/api/travel/v1/search';
const fieldClass =
  'mt-2 w-full rounded-lg border border-rule bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-faint focus:border-violet';

function browserToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateAfterDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isFlightResponse(value: unknown): value is FlightSearchResponse {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<FlightSearchResponse>;
  return Boolean(candidate.query && Array.isArray(candidate.routeGroups) && typeof candidate.offerCount === 'number');
}

export default function TravelGuide() {
  const { lang } = useI18n();
  const language = lang as TravelLanguage;
  const copy = travelCopy[language];
  const [draft, setDraft] = useState<TravelSearch>(INITIAL_SEARCH);
  const [appliedSearch, setAppliedSearch] = useState<TravelSearch | null>(null);
  const [result, setResult] = useState<FlightSearchResponse | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [originError, setOriginError] = useState('');
  const [dateError, setDateError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [loading, setLoading] = useState(false);
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => activeRequest.current?.abort();
  }, []);

  const selectedGroup = useMemo(
    () => result?.routeGroups.find((group) => group.id === selectedGroupId) ?? result?.routeGroups[0] ?? null,
    [result, selectedGroupId],
  );

  const screeningSearch = useMemo(() => {
    if (!appliedSearch) return null;
    return {
      ...appliedSearch,
      passportCountry: draft.passportCountry,
      ticketArrangement: draft.ticketArrangement,
      baggageArrangement: draft.baggageArrangement,
    };
  }, [appliedSearch, draft.passportCountry, draft.ticketArrangement, draft.baggageArrangement]);

  const errorForCode = (code: string) => {
    if (['INVALID_REQUEST', 'INVALID_ORIGIN', 'INVALID_DESTINATION', 'SAME_AIRPORT', 'INVALID_DATE', 'PAST_DATE', 'DATE_TOO_FAR'].includes(code)) {
      return copy.errorInvalid;
    }
    if (['RATE_LIMITED', 'LIVE_SEARCH_LIMITED'].includes(code)) return copy.errorRate;
    if (code === 'DAILY_SEARCH_LIMIT' || code === 'PROVIDER_LIMIT') return copy.errorDaily;
    return copy.errorProvider;
  };

  const runSearch = async (input: TravelSearch) => {
    const origin = input.origin.trim().toUpperCase();
    const today = browserToday();
    const maxDate = dateAfterDays(today, 365);
    let invalid = false;

    if (!/^[A-Z]{3}$/.test(origin) || origin === input.destination) {
      setOriginError(copy.invalidOrigin);
      invalid = true;
    } else {
      setOriginError('');
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.departureDate) || input.departureDate < today || input.departureDate > maxDate) {
      setDateError(copy.invalidDate);
      invalid = true;
    } else {
      setDateError('');
    }
    if (invalid) return;

    const nextSearch = { ...input, origin };
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setSearchError('');

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: nextSearch.origin,
          destination: nextSearch.destination,
          departureDate: nextSearch.departureDate,
        }),
        signal: controller.signal,
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const code =
          payload && typeof payload === 'object' && 'error' in payload && payload.error && typeof payload.error === 'object' && 'code' in payload.error
            ? String(payload.error.code)
            : '';
        throw new Error(errorForCode(code));
      }
      if (!isFlightResponse(payload)) throw new Error(copy.errorProvider);

      setDraft(nextSearch);
      setAppliedSearch(nextSearch);
      setResult(payload);
      setSelectedGroupId(payload.routeGroups[0]?.id ?? '');
    } catch (error) {
      if (controller.signal.aborted) return;
      setSearchError(error instanceof Error ? error.message : copy.searchFailed);
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runSearch(draft);
  };

  return (
    <div className="hero-grid min-h-screen">
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="max-w-3xl">
          <p className="font-mono text-xs font-semibold tracking-[0.18em] text-cyan">{copy.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl">{copy.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">{copy.introduction}</p>
          <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-medium">
            <span className="rounded-full border border-cyan/35 bg-cyan/[0.06] px-3 py-1.5 text-cyan">{copy.flightsStage}</span>
            <span className="rounded-full border border-violet/40 bg-violet/[0.07] px-3 py-1.5 text-violet-300">{copy.documentsStage}</span>
            <span className="rounded-full border border-rule bg-panel px-3 py-1.5 text-faint">{copy.localStage}</span>
          </div>
        </header>

        <section className="mt-10 rounded-xl border border-rule bg-panel p-4 sm:p-6" aria-labelledby="travel-search-title">
          <div className="max-w-2xl">
            <h2 id="travel-search-title" className="text-xl font-semibold text-foreground">{copy.formTitle}</h2>
            <p className="mt-1 text-sm leading-6 text-muted">{copy.formDescription}</p>
          </div>

          <form onSubmit={submitSearch} className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
            <label className="text-xs font-medium text-muted lg:col-span-2">
              {copy.originLabel}
              <input
                type="text"
                value={draft.origin}
                onChange={(event) => {
                  setDraft({ ...draft, origin: event.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) });
                  if (originError) setOriginError('');
                }}
                list="travel-airports"
                inputMode="text"
                autoComplete="off"
                maxLength={3}
                placeholder={copy.originPlaceholder}
                aria-invalid={Boolean(originError)}
                aria-describedby={originError ? 'origin-error' : 'origin-help'}
                className={fieldClass}
              />
              <datalist id="travel-airports">
                {AIRPORT_SUGGESTIONS.map((item) => (
                  <option key={item.code} value={item.code}>{item.city[language]}</option>
                ))}
              </datalist>
              <span id={originError ? 'origin-error' : 'origin-help'} className={`mt-1.5 block text-[11px] ${originError ? 'text-red-300' : 'text-faint'}`}>
                {originError || copy.originHelp}
              </span>
            </label>

            <label className="text-xs font-medium text-muted lg:col-span-2">
              {copy.destinationLabel}
              <select
                value={draft.destination}
                onChange={(event) => {
                  setDraft({ ...draft, destination: event.target.value as DestinationCode });
                  if (originError) setOriginError('');
                }}
                className={fieldClass}
              >
                <option value="FUK">{copy.fukOption}</option>
                <option value="KKJ">{copy.kkjOption}</option>
              </select>
            </label>

            <label className="text-xs font-medium text-muted lg:col-span-2">
              {copy.dateLabel}
              <input
                type="date"
                value={draft.departureDate}
                required
                onChange={(event) => {
                  setDraft({ ...draft, departureDate: event.target.value });
                  if (dateError) setDateError('');
                }}
                aria-invalid={Boolean(dateError)}
                aria-describedby={dateError ? 'date-error' : 'date-help'}
                className={fieldClass}
              />
              <span id={dateError ? 'date-error' : 'date-help'} className={`mt-1.5 block text-[11px] ${dateError ? 'text-red-300' : 'text-faint'}`}>
                {dateError || copy.dateHelp}
              </span>
            </label>

            <label className="text-xs font-medium text-muted sm:col-span-2">
              {copy.passportLabel}
              <input
                type="text"
                value={draft.passportCountry}
                onChange={(event) => setDraft({ ...draft, passportCountry: event.target.value })}
                list="passport-countries"
                autoComplete="country-name"
                placeholder={copy.passportPlaceholder}
                className={fieldClass}
              />
              <datalist id="passport-countries">
                {['China', 'India', 'Indonesia', 'Vietnam', 'South Korea', 'United Kingdom', 'United States', 'France', 'Germany'].map((country) => (
                  <option key={country} value={country} />
                ))}
              </datalist>
              <span className="mt-1.5 block text-[11px] text-faint">{copy.passportHelp}</span>
            </label>

            <label className="text-xs font-medium text-muted sm:col-span-2">
              {copy.ticketLabel}
              <select
                value={draft.ticketArrangement}
                onChange={(event) => setDraft({ ...draft, ticketArrangement: event.target.value as TicketArrangement })}
                className={fieldClass}
              >
                <option value="unknown">{copy.ticketUnknown}</option>
                <option value="single">{copy.ticketSingle}</option>
                <option value="separate">{copy.ticketSeparate}</option>
              </select>
            </label>

            <label className="text-xs font-medium text-muted sm:col-span-2">
              {copy.baggageLabel}
              <select
                value={draft.baggageArrangement}
                onChange={(event) => setDraft({ ...draft, baggageArrangement: event.target.value as BaggageArrangement })}
                className={fieldClass}
              >
                <option value="unknown">{copy.baggageUnknown}</option>
                <option value="through">{copy.baggageThrough}</option>
                <option value="collect">{copy.baggageCollect}</option>
                <option value="cabin-only">{copy.baggageCabin}</option>
              </select>
            </label>

            <div className="flex flex-col gap-4 border-t border-rule pt-5 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between lg:col-span-6">
              <div className="max-w-3xl space-y-1">
                <p className="text-[11px] leading-5 text-faint">{copy.studentStatus}</p>
                <p className="text-[11px] leading-5 text-faint">{copy.searchDisclosure}</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="shrink-0 rounded-lg bg-foreground px-5 py-2.5 text-xs font-semibold text-background hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-55"
              >
                {loading ? copy.searching : copy.searchAction}
              </button>
            </div>
          </form>
        </section>

        {searchError && (
          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-red-400/30 bg-red-400/[0.06] px-4 py-4 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between" role="alert">
            <span>{searchError}</span>
            <button type="button" onClick={() => void runSearch(draft)} className="self-start rounded-lg border border-red-300/30 px-3 py-2 text-xs font-semibold sm:self-auto">
              {copy.retry}
            </button>
          </div>
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(19rem,0.75fr)] lg:items-start" aria-live="polite" aria-busy={loading}>
          {result && appliedSearch ? (
            <FlightRouteExplorer
              result={result}
              search={appliedSearch}
              language={language}
              selectedGroup={selectedGroup}
              onGroupChange={setSelectedGroupId}
            />
          ) : (
            <section className="rounded-xl border border-dashed border-rule bg-panel/65 p-8 sm:p-10">
              <p className="font-mono text-xs font-semibold tracking-[0.14em] text-faint">FUK / KKJ</p>
              <h2 className="mt-3 text-xl font-semibold text-foreground">{copy.initialTitle}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{copy.initialBody}</p>
            </section>
          )}

          <div className="space-y-5 lg:sticky lg:top-24">
            {selectedGroup && screeningSearch ? (
              <TransitDocumentChecker offer={selectedGroup.cheapestOffer} search={screeningSearch} language={language} />
            ) : null}
            <aside className="rounded-xl border border-rule bg-panel p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mt-0.5 h-5 w-5 shrink-0 text-cyan" aria-hidden="true">
                  <path d="M12 3 5 6v5c0 4.6 2.9 8.1 7 10 4.1-1.9 7-5.4 7-10V6l-7-3Z" strokeWidth="1.6" strokeLinejoin="round" />
                  <path d="M9.5 12 11 13.5l3.7-4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{copy.privateTitle}</h2>
                  <p className="mt-1 text-xs leading-5 text-muted">{copy.privateBody}</p>
                  <Link href="/privacy" className="mt-3 inline-flex text-xs font-medium text-cyan hover:underline">{copy.privacyLink}</Link>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <section className="mt-10 rounded-xl border border-dashed border-rule bg-panel/60 p-5 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-foreground">{copy.futureTitle}</h2>
              <span className="rounded-full border border-rule px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">{copy.futureBadge}</span>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{copy.futureBody}</p>
          </div>
          <div className="mt-5 flex shrink-0 items-center gap-2 font-mono text-xs text-faint sm:mt-0">
            <span className="rounded-md border border-rule bg-background px-2 py-1">FUK</span>
            <span>+</span>
            <span className="rounded-md border border-rule bg-background px-2 py-1">KKJ</span>
          </div>
        </section>
      </main>
    </div>
  );
}
