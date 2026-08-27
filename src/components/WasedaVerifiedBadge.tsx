interface WasedaVerifiedBadgeProps {
  compact?: boolean;
}

export default function WasedaVerifiedBadge({ compact = false }: WasedaVerifiedBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 font-semibold text-cyan-200 ${
        compact ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-1 text-[9px]'
      }`}
      title="Verified with a Waseda email address; this does not confirm current student or IPS status."
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3 fill-none stroke-current">
        <path d="m4 8 2.2 2.2L12 4.8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      waseda-verified
    </span>
  );
}
