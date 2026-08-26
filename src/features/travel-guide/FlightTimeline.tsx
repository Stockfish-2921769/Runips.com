import { travelCopy } from './copy';
import { formatDuration, formatPrice, type FlightOffer, type TravelLanguage } from './model';

function localTimeParts(value: string, language: TravelLanguage) {
  const [dateValue = '', time = ''] = value.split(' ');
  const parsed = new Date(`${dateValue}T00:00:00Z`);
  const date = Number.isNaN(parsed.getTime())
    ? dateValue
    : new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(parsed);
  return { date, time: time || '--:--' };
}

export default function FlightTimeline({
  offer,
  language,
}: {
  offer: FlightOffer;
  language: TravelLanguage;
}) {
  const copy = travelCopy[language];

  return (
    <section className="rounded-xl border border-rule bg-panel">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-rule px-4 py-4 sm:px-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-faint">{copy.itinerary}</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {offer.segments.map((segment) => segment.flightNumber).join(' · ')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold tabular-nums text-foreground">
            {formatPrice(offer.price.amount, offer.price.currency, language)}
          </p>
          <p className="mt-1 text-xs text-faint">{copy.totalJourney} · {formatDuration(offer.totalDurationMinutes, language)}</p>
        </div>
      </div>

      <div className="space-y-1 px-4 py-5 sm:px-5">
        {offer.segments.map((segment, index) => {
          const departure = localTimeParts(segment.departureAirport.localTime, language);
          const arrival = localTimeParts(segment.arrivalAirport.localTime, language);
          const layover = offer.layovers[index];
          return (
            <div key={`${segment.id}-${segment.flightNumber}`}>
              <div className="grid grid-cols-[3.75rem_1.25rem_minmax(0,1fr)] gap-x-3">
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold tabular-nums text-foreground">{departure.time}</p>
                  <p className="mt-1 text-[9px] leading-4 text-faint">{departure.date}</p>
                </div>
                <div className="flex flex-col items-center">
                  <span className="mt-1 h-3 w-3 rounded-full border-2 border-violet bg-background" />
                  <span className="min-h-28 w-px grow bg-rule" />
                </div>
                <div className="pb-5">
                  <p className="font-mono text-sm font-bold text-foreground">{segment.departureAirport.code}</p>
                  <p className="mt-0.5 text-xs text-muted">{segment.departureAirport.name}</p>

                  <div className="mt-4 rounded-lg border border-rule bg-background/70 p-3 text-xs">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-faint">{copy.flight}</p>
                        <p className="mt-1 font-mono font-semibold text-foreground">{segment.flightNumber}</p>
                      </div>
                      <div>
                        <p className="text-faint">{copy.operatedBy}</p>
                        <p className="mt-1 font-medium text-muted">{segment.airline}</p>
                      </div>
                      <div>
                        <p className="text-faint">{copy.aircraft}</p>
                        <p className="mt-1 font-medium text-muted">{segment.aircraft}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-rule pt-3 text-[10px] text-faint">
                      <span>{formatDuration(segment.durationMinutes, language)}</span>
                      <span>{copy.travelClass}: {segment.travelClass}</span>
                      {segment.operatedBy ? <span>{copy.operatingCarrier}: {segment.operatedBy}</span> : null}
                      {segment.overnight ? <span>{copy.overnight}</span> : null}
                      {segment.oftenDelayed ? <span className="text-amber-300">{copy.oftenDelayed}</span> : null}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-mono text-sm font-semibold tabular-nums text-foreground">{arrival.time}</p>
                  <p className="mt-1 text-[9px] leading-4 text-faint">{arrival.date}</p>
                </div>
                <div className="flex flex-col items-center">
                  <span className="mt-1 h-3 w-3 rounded-full border-2 border-cyan bg-background" />
                  {layover ? <span className="min-h-14 w-px grow border-l border-dashed border-rule" /> : null}
                </div>
                <div className={layover ? 'pb-4' : ''}>
                  <p className="font-mono text-sm font-bold text-foreground">{segment.arrivalAirport.code}</p>
                  <p className="mt-0.5 text-xs text-muted">{segment.arrivalAirport.name}</p>
                  {layover && (
                    <div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-md border border-rule bg-panel-raised px-2.5 py-1.5 text-xs text-muted">
                      <span>{formatDuration(layover.durationMinutes, language)} {copy.connection}</span>
                      {layover.overnight ? <span className="text-amber-300">{copy.overnight}</span> : null}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
