interface RatingSelectorProps {
  id: string;
  label: string;
  description?: string;
  value: number;
  lowLabel?: string;
  highLabel?: string;
  onChange: (value: number) => void;
}

export default function RatingSelector({
  id,
  label,
  description,
  value,
  lowLabel,
  highLabel,
  onChange,
}: RatingSelectorProps) {
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
            onClick={() => onChange(score)}
            aria-pressed={value === score}
            aria-label={`${label}: ${score}`}
            className={`h-9 flex-1 rounded-md border text-sm font-bold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet ${
              value === score
                ? 'border-violet bg-violet text-white'
                : 'border-rule bg-background text-faint hover:border-violet/60 hover:text-foreground'
            }`}
          >
            {score}
          </button>
        ))}
      </div>
      {(lowLabel || highLabel) && (
        <div className="mt-1 flex justify-between text-[9px] text-faint">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </fieldset>
  );
}
