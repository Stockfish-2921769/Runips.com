import { countryName, resolveAirport } from './airports';
import { travelCopy } from './copy';
import { localise, type Connection, type FlightOffer, type TravelLanguage, type TravelSearch } from './model';

type AssessmentKind = 'low' | 'verify' | 'landside' | 'japan-entry' | 'tw-transit-pilot';

/**
 * Transit through Taiwan on a Chinese passport runs on a pilot scheme covering
 * three departure cities. What the scheme covers is the *flight into Taoyuan*,
 * not the itinerary as a whole: CKG–CAN–TPE leaves China at Guangzhou, so it
 * falls outside the scheme even though it started in a pilot city. Only a
 * direct pilot-city→Taoyuan leg qualifies.
 *
 * This fails at check-in rather than at the gate — early enough to be worth
 * flagging before the ticket is bought.
 */
const TW_TRANSIT_PILOT_ORIGINS = new Set(['CKG', 'KMG', 'KHN']);

/**
 * The passport field is free text, so this matches the common spellings while
 * ruling out the SAR and Taiwan passports first — "Hong Kong, China" contains
 * "china" but is not a mainland passport, and the rule does not apply to it.
 */
function isMainlandChinaPassport(value: string): boolean {
  const v = value.toLowerCase().replace(/[\s.,'\u2019\u00b7\u3001]/g, '');

  // Unambiguous mainland spellings are settled before the exclusions run:
  // "People's Republic of China" contains "Republic of China" as a substring
  // yet is precisely the passport this rule is about.
  if (['peoplesrepublicofchina', 'prc', 'chn', '中华人民共和国', '中華人民共和國'].some((t) => v.includes(t))) {
    return true;
  }

  // The SARs and Taiwan issue their own passports and are outside this rule.
  // "Hong Kong, China" contains "china" and must not match.
  const notMainland = [
    'hongkong', 'hksar', '香港',
    'macau', 'macao', '澳门', '澳門',
    'taiwan', 'chinesetaipei', 'republicofchina', '台湾', '台灣', '中華民國', '中华民国',
  ];
  if (notMainland.some((t) => v.includes(t))) return false;

  return ['china', '中国', '中國'].some((t) => v.includes(t));
}

function assessConnection(
  connection: Connection,
  search: TravelSearch,
  /** Where the flight *arriving at this connection* departed from. */
  inboundFrom: string,
): AssessmentKind {
  // Checked before everything else: it is the one combination that gets the
  // passenger turned away at the counter rather than merely delayed.
  if (
    connection.airport.countryCode === 'TW' &&
    isMainlandChinaPassport(search.passportCountry) &&
    !TW_TRANSIT_PILOT_ORIGINS.has(inboundFrom.toUpperCase())
  ) {
    return 'tw-transit-pilot';
  }
  if (connection.airport.countryCode === 'JP') return 'japan-entry';
  if (search.ticketArrangement === 'separate' || search.baggageArrangement === 'collect') return 'landside';
  if (!search.passportCountry.trim() || search.ticketArrangement === 'unknown' || search.baggageArrangement === 'unknown') {
    return 'verify';
  }
  return 'low';
}

/** "台北（台湾）" — the bracketed country is what the transit rules key off. */
function transitLabel(connection: Connection, language: TravelLanguage): string {
  const city = localise(connection.airport.city, language);
  const country = countryName(connection.airport.countryCode, language);
  // City-states would otherwise read "Hong Kong (Hong Kong)".
  if (!country || country === city) return city;
  return language === 'zh' ? `${city}（${country}）` : `${city} (${country})`;
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
  // Each layover is where one segment lands, so the segment at the same index
  // is the one that flew in. Matched by code as well, in case a provider ever
  // returns layovers that do not line up one-for-one with segments.
  const inboundFrom = (layoverCode: string, index: number): string => {
    const atIndex = offer.segments[index];
    if (atIndex?.arrivalAirport.code === layoverCode) return atIndex.departureAirport.code;
    return offer.segments.find((s) => s.arrivalAirport.code === layoverCode)?.departureAirport.code ?? '';
  };
  const inboundOrigins = offer.layovers.map((layover, index) => inboundFrom(layover.code, index));
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
    'tw-transit-pilot': {
      label: copy.twTransitPilot,
      body: copy.twTransitPilotBody,
      classes: 'border-red-500/45 bg-red-500/[0.09] text-red-300',
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
              const assessment = assessConnection(connection, search, inboundOrigins[index] ?? '');
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
                        {connection.airport.code} · {transitLabel(connection, language)}
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

        {/* A link, not a redirect: the visitor is mid-flow here, and throwing
            them off the site loses everything they just typed. IATA blocks
            automated requests outright — three networks all get a 403 — so
            embedding or reading their data is off the table, and their form
            takes no prefill we could verify. What we can do is hand over the
            values they already entered so nothing has to be recalled. */}
        <div className="rounded-lg border border-cyan/30 bg-cyan/[0.05] p-4">
          <h3 className="text-sm font-semibold text-foreground">{copy.officialTitle}</h3>
          <p className="mt-2 text-xs leading-5 text-muted">{copy.officialBody}</p>

          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan">
            {copy.officialFillTitle}
          </p>
          <dl className="mt-2 space-y-1.5 text-xs">
            <div className="flex gap-2">
              <dt className="shrink-0 text-faint">{copy.officialFillNationality}</dt>
              <dd className="font-medium text-foreground">{search.passportCountry.trim() || copy.unknown}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 text-faint">{copy.officialFillDestination}</dt>
              <dd className="font-medium text-foreground">Japan</dd>
            </div>
            {connections.length > 0 && (
              <div className="flex gap-2">
                <dt className="shrink-0 text-faint">{copy.officialFillTransit}</dt>
                <dd className="font-medium text-foreground">
                  {connections
                    .map((connection) => `${connection.airport.code} · ${transitLabel(connection, language)}`)
                    .join(' / ')}
                </dd>
              </div>
            )}
          </dl>

          <a
            href="https://www.iatatravelcentre.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-cyan/50 bg-cyan/10 px-4 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan/20"
          >
            {copy.officialAction}
            <span aria-hidden="true">↗</span>
          </a>
        </div>

        <p className="text-[11px] leading-5 text-faint">{copy.disclaimer}</p>
      </div>
    </section>
  );
}
