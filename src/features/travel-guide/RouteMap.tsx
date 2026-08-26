import { resolveAirport } from './airports';
import { travelCopy } from './copy';
import { routeCodes, type Airport, type FlightOffer, type TravelLanguage } from './model';

const WIDTH = 900;
const HEIGHT = 360;

interface Point {
  x: number;
  y: number;
}

interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

function project(airport: Airport): Point {
  return {
    x: ((airport.longitude + 180) / 360) * WIDTH,
    y: ((90 - airport.latitude) / 180) * HEIGHT,
  };
}

function getViewport(points: Point[]): Viewport {
  const xValues = points.map((point) => point.x);
  const yValues = points.map((point) => point.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const crossesDateLine = maxX - minX > WIDTH / 2;

  if (crossesDateLine) return { x: 0, y: 0, width: WIDTH, height: HEIGHT };

  let viewWidth = Math.max(180, maxX - minX + 110);
  let viewHeight = Math.max(72, maxY - minY + 54);
  const aspectRatio = WIDTH / HEIGHT;

  if (viewWidth / viewHeight > aspectRatio) viewHeight = viewWidth / aspectRatio;
  else viewWidth = viewHeight * aspectRatio;

  viewWidth = Math.min(WIDTH, viewWidth);
  viewHeight = Math.min(HEIGHT, viewHeight);

  return {
    x: Math.max(0, Math.min(WIDTH - viewWidth, (minX + maxX - viewWidth) / 2)),
    y: Math.max(0, Math.min(HEIGHT - viewHeight, (minY + maxY - viewHeight) / 2)),
    width: viewWidth,
    height: viewHeight,
  };
}

function arcPath(from: Point, to: Point, scale: number) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const lift = Math.min(68 * scale, Math.max(18 * scale, distance * 0.16));
  const controlX = (from.x + to.x) / 2;
  const controlY = Math.min(from.y, to.y) - lift;
  return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
}

function routePaths(from: Point, to: Point, scale: number) {
  if (Math.abs(to.x - from.x) <= WIDTH / 2) return [arcPath(from, to, scale)];
  const wrappedTo = { ...to, x: to.x > from.x ? to.x - WIDTH : to.x + WIDTH };
  const wrappedFrom = { ...from, x: wrappedTo.x < 0 ? from.x + WIDTH : from.x - WIDTH };
  return [arcPath(from, wrappedTo, scale), arcPath(wrappedFrom, to, scale)];
}

function offerAirports(offer: FlightOffer) {
  if (offer.segments.length === 0) return [];
  const first = offer.segments[0].departureAirport;
  return [
    resolveAirport(first.code, first.name),
    ...offer.segments.map((segment) => resolveAirport(segment.arrivalAirport.code, segment.arrivalAirport.name)),
  ];
}

function SchematicRoute({ airports, label }: { airports: Airport[]; label: string }) {
  const startX = 90;
  const endX = 810;
  const step = airports.length > 1 ? (endX - startX) / (airports.length - 1) : 0;
  const points = airports.map((_, index) => ({ x: startX + step * index, y: 125 }));

  return (
    <svg viewBox="0 0 900 250" className="block min-h-52 w-full" role="img" aria-label={label}>
      <rect width="900" height="250" fill="#0a0a0d" />
      <g stroke="#1f1f24" strokeWidth="1">
        {[1, 2, 3, 4, 5].map((value) => <line key={value} x1="0" y1={value * 40} x2="900" y2={value * 40} />)}
      </g>
      {points.slice(0, -1).map((point, index) => {
        const next = points[index + 1];
        return (
          <path
            key={`${point.x}-${next.x}`}
            d={`M ${point.x} ${point.y} Q ${(point.x + next.x) / 2} 70 ${next.x} ${next.y}`}
            fill="none"
            stroke={index % 2 === 0 ? '#a78bfa' : '#22d3ee'}
            strokeWidth="3"
            strokeDasharray="7 7"
          />
        );
      })}
      {airports.map((airport, index) => {
        const point = points[index];
        const endpoint = index === 0 || index === airports.length - 1;
        return (
          <g key={`${airport.code}-${index}`}>
            <circle cx={point.x} cy={point.y} r={endpoint ? 8 : 7} fill="#09090b" stroke={endpoint ? '#fafafa' : '#22d3ee'} strokeWidth="3" />
            <text x={point.x} y={point.y - 20} textAnchor="middle" fill="#fafafa" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="16" fontWeight="700">
              {airport.code}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function RouteMap({ offer, language }: { offer: FlightOffer; language: TravelLanguage }) {
  const copy = travelCopy[language];
  const airports = offerAirports(offer);
  const codes = routeCodes(offer);
  if (airports.length === 0) return null;

  const hasApproximateAirport = airports.some((airport) => airport.approximate);
  if (hasApproximateAirport) {
    return (
      <figure className="overflow-hidden rounded-xl border border-rule bg-[#0a0a0d]">
        <figcaption className="flex items-center justify-between border-b border-rule px-4 py-3 sm:px-5">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{copy.routeMap}</span>
          <span className="font-mono text-xs text-faint">{codes.join(' — ')}</span>
        </figcaption>
        <SchematicRoute airports={airports} label={`${copy.routeMap}: ${codes.join(' to ')}`} />
        <p className="border-t border-rule px-4 py-3 text-xs leading-5 text-faint sm:px-5">{copy.schematicRoute}</p>
      </figure>
    );
  }

  const points = airports.map(project);
  const viewport = getViewport(points);
  const scale = viewport.width / WIDTH;

  return (
    <figure className="overflow-hidden rounded-xl border border-rule bg-[#0a0a0d]">
      <figcaption className="flex items-center justify-between border-b border-rule px-4 py-3 sm:px-5">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{copy.routeMap}</span>
        <span className="font-mono text-xs text-faint">{codes.join(' — ')}</span>
      </figcaption>

      <svg viewBox={`${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`} className="block h-auto min-h-56 w-full" role="img" aria-label={`${copy.routeMap}: ${codes.join(' to ')}`}>
        <rect width={WIDTH} height={HEIGHT} fill="#0a0a0d" />
        <g stroke="#1f1f24" strokeWidth={scale}>
          {[1, 2, 3, 4, 5].map((step) => {
            const x = viewport.x + (viewport.width * step) / 6;
            return <line key={`x-${step}`} x1={x} y1={viewport.y} x2={x} y2={viewport.y + viewport.height} />;
          })}
          {[1, 2, 3, 4, 5].map((step) => {
            const y = viewport.y + (viewport.height * step) / 6;
            return <line key={`y-${step}`} x1={viewport.x} y1={y} x2={viewport.x + viewport.width} y2={y} />;
          })}
        </g>
        <g fill="#17171b" stroke="#29292f" strokeWidth={1.2 * scale}>
          <path d="M45 82 L92 48 L164 46 L214 72 L239 112 L210 140 L176 129 L151 161 L114 153 L87 122 L55 116 Z" />
          <path d="M183 169 L220 179 L237 219 L223 263 L202 310 L181 282 L168 235 L157 196 Z" />
          <path d="M386 73 L448 51 L525 57 L576 82 L639 76 L709 99 L777 114 L805 145 L765 166 L708 151 L657 170 L598 151 L554 126 L501 132 L462 111 L409 113 Z" />
          <path d="M444 139 L497 142 L526 174 L517 228 L486 280 L451 246 L433 195 Z" />
          <path d="M733 241 L777 223 L825 242 L833 278 L798 296 L753 281 Z" />
          <path d="M301 41 L328 28 L357 39 L349 64 L317 71 Z" />
        </g>
        <g fill="none" strokeLinecap="round">
          {points.slice(0, -1).flatMap((point, index) =>
            routePaths(point, points[index + 1], scale).map((path, pathIndex) => (
              <path key={`${index}-${pathIndex}`} d={path} stroke={index % 2 === 0 ? '#a78bfa' : '#22d3ee'} strokeWidth={3 * scale} strokeDasharray={`${7 * scale} ${7 * scale}`} opacity="0.9" />
            )),
          )}
        </g>
        {airports.map((airport, index) => {
          const point = points[index];
          const alignRight = point.x > viewport.x + viewport.width * 0.82;
          const endpoint = index === 0 || index === airports.length - 1;
          return (
            <g key={`${airport.code}-${index}`}>
              <circle cx={point.x} cy={point.y} r={(endpoint ? 7 : 6) * scale} fill="#09090b" stroke={endpoint ? '#fafafa' : '#22d3ee'} strokeWidth={3 * scale} />
              <text x={alignRight ? point.x - 12 * scale : point.x + 12 * scale} y={point.y - 11 * scale} textAnchor={alignRight ? 'end' : 'start'} fill="#fafafa" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize={14 * scale} fontWeight="700">
                {airport.code}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
