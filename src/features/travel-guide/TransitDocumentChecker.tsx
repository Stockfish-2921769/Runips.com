import { resolveAirport } from './airports';
import { travelCopy } from './copy';
import { localise, type Connection, type FlightOffer, type TravelLanguage, type TravelSearch } from './model';

type AssessmentKind = 'low' | 'verify' | 'landside' | 'japan-entry';

function assessConnection(connection: Connection, search: TravelSearch): AssessmentKind {
  if (connection.airport.countryCode === 'JP') return 'japan-entry';
  if (search.ticketArrangement === 'separate' || search.baggageArrangement === 'collect') return 'landside';
  if (!search.passportCountry.trim() || search.ticketArrangement === 'unknown' || search.baggageArrangement === 'unknown') {
    return 'verify';
  }
  return 'low';
}

function isShortConnection(connection: Connection, assessment: AssessmentKind) {
  if (connection.durationMinutes <= 0) return false;
  if (assessment === 'landside' || assessment === 'japan-entry') return connection.durationMinutes < 180;
  if (assessment === 'verify') return connection.durationMinutes < 120;
  return connection.durationMinutes < 75;
}

export default function TransitDocumentChecker({
  offer,
  search,
  language,
}: {
  offer: FlightOffer;
  search: TravelSearch;
  language: TravelLanguage;
}) {
  const copy = travelCopy[language];
  const connections: Connection[] = offer.layovers.map((layover) => ({
    airport: resolveAirport(layover.code, layover.name),
    durationMinutes: layover.durationMinutes,
    overnight: layover.overnight,
  }));
  const ticketLabels = {
    single: copy.ticketSingle,
    separate: copy.ticketSeparate,
    unknown: copy.ticketUnknown,
  };
  const baggageLabels = {
    through: copy.baggageThrough,
    collect: copy.baggageCollect,
    'cabin-only': copy.baggageCabin,
    unknown: copy.baggageUnknown,
  };
  const statusCopy: Record<AssessmentKind, { label: string; body: string; classes: string }> = {
    low: {
      label: copy.lowFriction,
      body: copy.lowFrictionBody,
      classes: 'border-cyan/30 bg-cyan/[0.06] text-cyan',
    },
    verify: {
      label: copy.verify,
      body: copy.verifyBody,
      classes: 'border-amber-400/30 bg-amber-400/[0.06] text-amber-300',
    },
    landside: {
      label: copy.landside,
      body: copy.landsideBody,
      classes: 'border-red-400/30 bg-red-400/[0.06] text-red-300',
    },
    'japan-entry': {
      label: copy.japanEntry,
      body: copy.japanEntryBody,
      classes: 'border-violet/35 bg-violet/[0.07] text-violet-300',
    },
  };

  return (
    <section aria-labelledby="document-check-title" className="rounded-xl border border-rule bg-panel">
      <div className="border-b border-rule px-4 py-5 sm:px-5">
        <h2 id="document-check-title" className="text-xl font-semibold text-foreground">{copy.documentTitle}</h2>
        <p className="mt-1 text-sm leading-6 text-muted">{copy.documentDescription}</p>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div className="rounded-lg border border-rule bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">{copy.passengerProfile}</p>
          <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-3">
            <div>
              <dt className="text-faint">{copy.passport}</dt>
              <dd className="mt-1 font-medium text-foreground">{search.passportCountry.trim() || copy.unknown}</dd>
            </div>
            <div>
              <dt className="text-faint">{copy.booking}</dt>
              <dd className="mt-1 font-medium text-foreground">{ticketLabels[search.ticketArrangement]}</dd>
            </div>
            <div>
              <dt className="text-faint">{copy.baggage}</dt>
              <dd className="mt-1 font-medium text-foreground">{baggageLabels[search.baggageArrangement]}</dd>
            </div>
          </dl>
        </div>

        {!search.passportCountry.trim() && connections.length > 0 && (
          <p className="rounded-lg border border-amber-400/25 bg-amber-400/[0.05] px-3.5 py-3 text-xs leading-5 text-amber-100/80">
            {copy.passportMissing}
          </p>
        )}

        {connections.length === 0 ? (
          <p className="rounded-lg border border-rule bg-background px-4 py-5 text-sm text-muted">{copy.noConnection}</p>
        ) : (
          <div className="space-y-3">
            {connections.map((connection, index) => {
              const assessment = assessConnection(connection, search);
              const status = statusCopy[assessment];
              const passportContext = search.passportCountry.trim()
                ? language === 'zh'
                  ? `需要按 ${search.passportCountry.trim()} 护照核验官方规则。`
                  : `An official rule check is still required for a ${search.passportCountry.trim()} passport.`
                : copy.passportMissing;

              return (
                <article key={`${connection.airport.code}-${index}`} className={`rounded-lg border p-4 ${status.classes}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-75">{copy.transitAt}</p>
                      <h3 className="mt-1 font-mono text-base font-bold text-foreground">
                        {connection.airport.code} · {localise(connection.airport.city, language)}
                      </h3>
                    </div>
                    <span className="rounded-full border border-current/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]">
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-muted">{status.body}</p>
                  <p className="mt-2 text-xs leading-5 text-foreground/80">{passportContext}</p>
                  {isShortConnection(connection, assessment) && (
                    <p className="mt-3 border-t border-current/15 pt-3 text-xs font-medium">{copy.shortConnection}</p>
                  )}
                  {connection.overnight && (
                    <p className="mt-3 border-t border-current/15 pt-3 text-xs font-medium">{copy.overnightConnection}</p>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <div className="rounded-lg border border-rule bg-background p-4">
          <h3 className="text-sm font-semibold text-foreground">{copy.checkListTitle}</h3>
          <ol className="mt-3 space-y-2.5 text-xs leading-5 text-muted">
            {[copy.checkTicket, copy.checkBaggage, copy.checkAirside, copy.checkPassport].map((item, index) => (
              <li key={item} className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-rule font-mono text-[10px] text-faint">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="text-[11px] leading-5 text-faint">{copy.disclaimer}</p>
      </div>
    </section>
  );
}
