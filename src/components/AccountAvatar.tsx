import { AccountAvatarColour } from '@/features/account/model';

const COLOUR_CLASSES: Record<AccountAvatarColour, string> = {
  violet: 'border-violet-400/35 bg-violet-500/20 text-violet-200',
  cyan: 'border-cyan-400/35 bg-cyan-500/20 text-cyan-100',
  blue: 'border-blue-400/35 bg-blue-500/20 text-blue-100',
  emerald: 'border-emerald-400/35 bg-emerald-500/20 text-emerald-100',
  amber: 'border-amber-400/35 bg-amber-500/20 text-amber-100',
  rose: 'border-rose-400/35 bg-rose-500/20 text-rose-100',
  slate: 'border-slate-400/35 bg-slate-500/20 text-slate-100',
  indigo: 'border-indigo-400/35 bg-indigo-500/20 text-indigo-100',
};

const SIZE_CLASSES = {
  xs: 'h-6 w-6 text-[9px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-20 w-20 text-2xl',
} as const;

interface AccountAvatarProps {
  displayName: string;
  username?: string;
  colour?: AccountAvatarColour;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

function avatarInitial(displayName: string, username = ''): string {
  const source = displayName.trim() || username.trim() || 'R';
  return [...source][0]?.toLocaleUpperCase() ?? 'R';
}

export default function AccountAvatar({
  displayName,
  username,
  colour = 'violet',
  size = 'sm',
  className = '',
}: AccountAvatarProps) {
  const label = displayName.trim() || username?.trim() || 'RunIPS member';

  return (
    <span
      role="img"
      aria-label={`${label} avatar`}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border font-bold uppercase ${COLOUR_CLASSES[colour]} ${SIZE_CLASSES[size]} ${className}`}
    >
      {avatarInitial(displayName, username)}
    </span>
  );
}

