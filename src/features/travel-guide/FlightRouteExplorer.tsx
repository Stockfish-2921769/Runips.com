'use client';

import { useMemo, useState } from 'react';
import { buildGoogleFlightsFallbackUrl, buildItaMatrixUrl, buildItaRoutingCode } from './itaMatrix';
import { travelCopy } from './copy';
import FlightTimeline from './FlightTimeline';
import RouteMap from './RouteMap';
import {
  formatDuration,
  formatPrice,
  routeCodes,
  type FlightRouteGroup,
  type FlightSearchResponse,
  type TravelLanguage,
  type TravelSearch,
} from './model';

function formatTimestamp(value: string, language: TravelLanguage) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

export default function FlightRouteExplorer({
  result,
  search,
  language,
  selectedGroup,
  onGroupChange,
}: {
  result: FlightSearchResponse;
  search: TravelSearch;
  language: TravelLanguage;
  selectedGroup: FlightRouteGroup | null;
  onGroupChange: (groupId: string) => void;
}) {
  const copy = travelCopy[language];
  const [copied, setCopied] = useState(false);
  const selectedOffer = selectedGroup?.cheapestOffer ?? null;
  const routingCode = useMemo(() => (selectedOffer ? buildItaRoutingCode(selectedOffer.segments) : ''), [selectedOffer]);
  const googleUrl = result.googleFlightsUrl || buildGoogleFlightsFallbackUrl({
    origin: search.origin,
    destination: search.destination,
    departureDate: search.departureDate,
  });

  const openMatrix = () => {
    const url = buildItaMatrixUrl({
      origin: search.origin,
      destination: search.destination,
      departureDate: search.departureDate,
      routingCode,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyRoutingCode = async () => {
    try {
      await navigator.clipboard.writeText(routingCode);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  if (result.routeGroups.length === 0 || !selectedGroup || !selectedOffer) {
    return (
      <section aria-labelledby="route-comparison-title" className="space-y-5">
        <div>
          <h2 id="route-comparison-title" className="text-xl font-semibold text-foreground">{copy.noResultsTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{copy.noResultsBody}</p>
        </div>
        <a
          href={googleUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-lg bg-foreground px-4 py-2.5 text-xs font-semibold text-background hover:bg-zinc-200"
        >
          {copy.googleAction}
        </a>
      </section>
    );
  }

  const selectedCodes = routeCodes(selectedOffer);

  return (
    <section aria-labelledby="route-comparison-title" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="route-comparison-title" className="text-xl font-semibold text-foreground">{copy.routeComparison}</h2>
          <p className="mt-1 text-sm text-muted">{copy.comparisonDescription}</p>
        </div>
        <div className="text-right text-[11px] leading-5 text-faint">
          <p>{copy.routesFound(result.routeGroups.length)}</p>
          <p>{copy.offersFound(result.offerCount)}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {result.routeGroups.map((group) => {
          const offer = group.cheapestOffer;
          const active = group.id === selectedGroup.id;
          const codes = routeCodes(offer);
          const connectionCount = offer.layovers.length;
          return (
            <button
              type="button"
              key={group.id}
              onClick={() => {
                setCopied(false);
                onGroupChange(group.id);
              }}
              aria-pressed={active}
              className={`rounded-xl border p-4 text-left ${
                active ? 'border-violet/70 bg-violet/[0.08]' : 'border-rule bg-panel hover:border-zinc-600'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs font-semibold text-cyan">{codes.join(' — ')}</p>
                  <h3 className="mt-2 text-base font-semibold text-foreground">
                    {group.kind === 'direct' ? copy.direct : copy.via(group.connectionCodes.join(' · '))}
                  </h3>
                </div>
                <span className="rounded-md border border-rule bg-background px-2 py-1 font-mono text-sm font-bold text-foreground">
                  {search.destination}
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between gap-4 border-t border-rule pt-3">
                <div className="text-xs text-muted">
                  <p>{formatDuration(offer.totalDurationMinutes, language)}</p>
                  <p className="mt-1 text-[11px] text-faint">
                    {connectionCount} {connectionCount === 1 ? copy.connection : copy.connections}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-faint">{copy.from}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                    {formatPrice(offer.price.amount, offer.price.currency, language)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-faint">{copy.alternativeCount(group.alternativeCount)}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3 text-xs leading-5 text-amber-100/80">
        {copy.sourceNotice}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-amber-100/55">
          <span>{copy.providerAsOf}: {formatTimestamp(result.providerFetchedAt, language)}</span>
          {result.cache.hit ? <span>{copy.cachedResult}: {result.cache.ageSeconds}s</span> : null}
        </div>
      </div>

      <RouteMap offer={selectedOffer} language={language} />
      <FlightTimeline offer={selectedOffer} language={language} />

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-rule bg-panel-raised p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-foreground">{copy.googleTitle}</h3>
          <p className="mt-2 text-xs leading-5 text-muted">{copy.googleBody}</p>
          <a
            href={googleUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-xs font-semibold text-background hover:bg-zinc-200"
          >
            {copy.googleAction}
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="h-4 w-4" aria-hidden="true">
              <path d="M7 4h9v9M16 4 6 14" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 11v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </a>
        </section>

        <section className="rounded-xl border border-rule bg-panel-raised p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-foreground">{copy.matrixTitle}</h3>
          <p className="mt-2 text-xs leading-5 text-muted">{copy.matrixBody}</p>
          <div className="mt-4 rounded-lg border border-rule bg-background p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">{copy.routingCode}</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <code className="min-w-0 break-all font-mono text-xs font-semibold text-cyan">{routingCode}</code>
              <button type="button" onClick={() => void copyRoutingCode()} className="shrink-0 rounded-md border border-rule px-2.5 py-1.5 text-[10px] font-semibold text-muted hover:text-foreground">
                {copied ? copy.copiedRouting : copy.copyRouting}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={openMatrix}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-foreground/30 px-4 py-2.5 text-xs font-semibold text-foreground hover:border-foreground/60"
          >
            {copy.matrixAction}
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="h-4 w-4" aria-hidden="true">
              <path d="M7 4h9v9M16 4 6 14" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 11v4a1 1 0 0 1-1 1H5a1 1 0 0 1 1-1V7a1 1 0 0 1 1-1h4" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
          <p className="mt-2 text-[10px] leading-4 text-faint">{copy.matrixFallback}</p>
        </section>
      </div>

      <p className="text-[10px] leading-4 text-faint">
        {copy.checkedAt}: {formatTimestamp(result.checkedAt, language)} · {selectedCodes.join(' → ')}
      </p>
    </section>
  );
}
