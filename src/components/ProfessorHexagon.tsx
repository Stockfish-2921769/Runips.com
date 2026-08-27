'use client';

/**
 * Six-dimension supervisor profile as a radar chart.
 *
 * Inline SVG rather than canvas: it stays sharp at any density, inherits the
 * theme's rule and surface tokens, and carries a real accessible name plus a
 * table the values can be read from exactly. Radar area is hard to read
 * precisely, so callers pair this with the numbers rather than replacing them.
 *
 * The scale runs 0–max, not 1–max. Ratings start at 1, so anchoring the rings
 * at 1 would stretch small differences across the whole plot and make a 3.0 and
 * a 3.5 look far apart. Zero-anchored keeps the shape honest.
 *
 * An axis nobody could rate is drawn as absent, never as zero. Plotting "not
 * applicable" at the centre would pull the shape inward and read as the worst
 * possible score — the opposite of what it means. Such an axis gets a dashed
 * spoke and a dimmed caption, and the outline simply does not reach it.
 */

const RINGS = 5;
const ANGLE_STEP = (Math.PI * 2) / 6;

// Passes the dark-surface checks in the dataviz palette validator
// (OKLCH L 0.60, chroma floor, ≥3:1 on #0d0d10). #06b6d4 sits above the band.
const SERIES = '#0ea5c9';

interface ProfessorHexagonProps {
  /** One score per axis in 0–max. `null`, `0` or NaN means the axis has no data. */
  values: (number | null | undefined)[];
  labels: string[];
  max?: number;
  emptyLabel?: string;
  ariaLabel?: string;
}

// The viewBox is wider than it is tall because the captions sit outside the
// plot to its left and right. A square box clipped "Research support" and
// "Communication" in English and "研究自主度" in Chinese.
const WIDTH = 380;
const HEIGHT = 240;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;
const RADIUS = 78;
const LABEL_GAP = 22;

/** Axis n as a point on a circle, starting at the top and going clockwise. */
function pointAt(index: number, radius: number) {
  const angle = index * ANGLE_STEP - Math.PI / 2;
  return {
    x: CX + Math.cos(angle) * radius,
    y: CY + Math.sin(angle) * radius,
  };
}

function polygon(radius: number) {
  return Array.from({ length: 6 }, (_, index) => {
    const { x, y } = pointAt(index, radius);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

export default function ProfessorHexagon({
  values,
  labels,
  max = 5,
  emptyLabel = '暂无评价',
  ariaLabel,
}: ProfessorHexagonProps) {
  const scores = Array.from({ length: 6 }, (_, index) => {
    const raw = values[index];
    if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) return null;
    return Math.min(raw, max);
  });

  const ratedIndices = scores.flatMap((score, index) => (score === null ? [] : [index]));
  const hasData = ratedIndices.length > 0;

  const vertices = ratedIndices.map((index) => {
    const { x, y } = pointAt(index, ((scores[index] as number) / max) * RADIUS);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  // Two rated axes make a line, not an area; one makes a dot. Filling either
  // would invent an area that no data supports.
  const outline = vertices.join(' ');
  const closedShape = ratedIndices.length >= 3;

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={ariaLabel}
      >
        {/* Rings and spokes are reference, not data: they stay recessive. */}
        <g stroke="var(--rule)" fill="none" strokeWidth={1}>
          {Array.from({ length: RINGS }, (_, ring) => (
            <polygon key={ring} points={polygon((RADIUS * (ring + 1)) / RINGS)} />
          ))}
          {Array.from({ length: 6 }, (_, index) => {
            const { x, y } = pointAt(index, RADIUS);
            return (
              <line
                key={index}
                x1={CX}
                y1={CY}
                x2={x}
                y2={y}
                // A dashed spoke marks an axis that carries no reading, so a
                // gap in the outline reads as missing rather than as low.
                strokeDasharray={scores[index] === null ? '2 3' : undefined}
              />
            );
          })}
        </g>

        {hasData && (
          <>
            {closedShape ? (
              <polygon points={outline} fill={SERIES} fillOpacity={0.18} stroke={SERIES} strokeWidth={2} />
            ) : (
              ratedIndices.length === 2 && (
                <polyline points={outline} fill="none" stroke={SERIES} strokeWidth={2} />
              )
            )}
            {ratedIndices.map((index) => {
              const { x, y } = pointAt(index, ((scores[index] as number) / max) * RADIUS);
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r={4}
                  fill={SERIES}
                  // A 2px surface ring keeps a vertex readable where it lands on
                  // a grid line.
                  stroke="var(--panel)"
                  strokeWidth={2}
                />
              );
            })}
          </>
        )}

        {labels.slice(0, 6).map((label, index) => {
          const { x, y } = pointAt(index, RADIUS + LABEL_GAP);
          // Anchor by which side of the centre the caption sits on, so nothing
          // overhangs the viewBox.
          const anchor = Math.abs(x - CX) < 1 ? 'middle' : x > CX ? 'start' : 'end';
          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="fill-[var(--faint)] text-[10px]"
              opacity={scores[index] === null ? 0.45 : 1}
            >
              {label}
            </text>
          );
        })}

        {!hasData && (
          <text
            x={CX}
            y={CY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-[var(--faint)] text-[11px]"
          >
            {emptyLabel}
          </text>
        )}
      </svg>
    </figure>
  );
}
