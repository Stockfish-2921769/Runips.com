import { DimensionRating } from './model';

interface BaseProps {
  id: string;
  label: string;
  description?: string;
  lowLabel?: string;
  highLabel?: string;
  /**
   * Five captions shown on the buttons in place of 1–5.
   *
   * Every other rating on this form means "5 is best". Research pressure only
   * means "5 is most", which the site is explicit is neither good nor bad — but
   * an identical row of numerals invites running 5s straight down the page.
   * Words carry no scale to run down.
   */
  optionLabels?: [string, string, string, string, string];
  /**
   * `quality` is the violet used for everything where higher is better.
   * `neutral` is the cyan the review list already uses for pressure, and is
   * deliberately not a red ramp: colouring high pressure as danger would
   * editorialise a measure we tell reviewers is neutral.
   */
  tone?: 'quality' | 'neutral';
}

/**
 * The two shapes are kept apart in the type so a required rating can never be
 * handed a null. Overall and pressure are answerable by every reviewer and stay
 * mandatory; only the six dimensions offer "not applicable".
 */
type RatingSelectorProps = BaseProps &
  (
    | {
        allowNotApplicable: true;
        notApplicableLabel: string;
        /** `null` is an explicit "not applicable"; `0` means nothing chosen yet. */
        value: DimensionRating;
        onChange: (value: DimensionRating) => void;
      }
    | {
        allowNotApplicable?: false;
        notApplicableLabel?: never;
        /** `0` means nothing chosen yet. */
        value: number;
        onChange: (value: number) => void;
      }
  );

export default function RatingSelector({
  id,
  label,
  description,
  value,
  lowLabel,
  highLabel,
  allowNotApplicable = false,
  notApplicableLabel,
  optionLabels,
  tone = 'quality',
  onChange,
}: RatingSelectorProps) {
  const selectedStyle =
    tone === 'neutral' ? 'border-cyan bg-cyan text-white' : 'border-violet bg-violet text-white';
  const hoverStyle =
    tone === 'neutral'
      ? 'border-rule bg-background text-faint hover:border-cyan/60 hover:text-foreground'
      : 'border-rule bg-background text-faint hover:border-violet/60 hover:text-foreground';
  const focusRing = tone === 'neutral' ? 'focus-visible:ring-cyan' : 'focus-visible:ring-violet';
  const notApplicable = value === null;
  // Widened once here so the body can stay a single implementation. The union
  // above is what keeps callers honest; inside, a null only ever originates
  // from the N/A button, which only renders when the caller opted in.
  const emit = onChange as (value: DimensionRating) => void;

  return (
    <fieldset className="min-w-0">
      <legend className="text-xs font-semibold text-muted">{label}</legend>
      {description && <p className="mt-0.5 text-[10px] leading-relaxed text-faint">{description}</p>}
      <div className="mt-2 flex items-center gap-1.5" aria-label={label}>
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            id={`${id}-${score}`}
            type="button"
            onClick={() => emit(score)}
            aria-pressed={value === score}
            aria-label={`${label}: ${optionLabels ? optionLabels[score - 1] : score}`}
            className={`min-h-9 flex-1 rounded-md border px-1 py-1 leading-tight focus-visible:outline-none focus-visible:ring-1 ${focusRing} ${
              optionLabels ? 'text-[10px] font-semibold' : 'text-sm font-bold'
            } ${
              value === score
                ? selectedStyle
                : notApplicable
                  ? 'border-rule/60 bg-background text-faint/40'
                  : hoverStyle
            }`}
          >
            {optionLabels ? optionLabels[score - 1] : score}
          </button>
        ))}
      </div>
      {(lowLabel || highLabel) && (
        <div className="mt-1 flex justify-between text-[9px] text-faint">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
      {allowNotApplicable && (
        // Deliberately on its own line rather than as a sixth button in the row
        // above: anything sitting beside 1–5 reads as a score of 6.
        <button
          type="button"
          onClick={() => emit(notApplicable ? 0 : null)}
          aria-pressed={notApplicable}
          className={`mt-2 rounded-md border px-2.5 py-1 text-[10px] font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet ${
            notApplicable
              ? 'border-violet bg-violet/15 text-violet-200'
              : 'border-rule bg-background text-faint hover:border-violet/60 hover:text-foreground'
          }`}
        >
          {notApplicableLabel}
        </button>
      )}
    </fieldset>
  );
}
