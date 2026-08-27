'use client';

import Link from 'next/link';
import AccountAvatar from '@/components/AccountAvatar';
import WasedaVerifiedBadge from '@/components/WasedaVerifiedBadge';
import { AccountAvatarColour } from '@/features/account/model';
import { useI18n } from '@/i18n/LanguageProvider';
import { communityMemberHref } from './model';
import { communityAuthorLabel } from './presentation';

interface CommunityAuthorProps {
  authorLabel: string;
  username: string;
  displayName: string;
  avatarColour: AccountAvatarColour;
  badges: string[];
  isMine?: boolean;
  compact?: boolean;
}

export default function CommunityAuthor({
  authorLabel,
  username,
  displayName,
  avatarColour,
  badges,
  isMine = false,
  compact = false,
}: CommunityAuthorProps) {
  const { lang } = useI18n();
  const publicName = username
    ? displayName || username
    : communityAuthorLabel(authorLabel, lang, isMine);
  const identity = (
    <>
      <AccountAvatar
        displayName={publicName}
        username={username}
        colour={username ? avatarColour : 'slate'}
        size={compact ? 'xs' : 'sm'}
      />
      <span className="min-w-0">
        <span className={`block truncate font-semibold text-foreground ${compact ? 'text-[10px]' : 'text-xs'}`}>
          {publicName}
        </span>
        {username && (
          <span className="block truncate font-mono text-[9px] text-faint">@{username}</span>
        )}
      </span>
    </>
  );

  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      {username ? (
        <Link
          href={communityMemberHref(username)}
          prefetch={false}
          className="inline-flex min-w-0 items-center gap-2 hover:opacity-80"
        >
          {identity}
        </Link>
      ) : (
        <span className="inline-flex min-w-0 items-center gap-2">{identity}</span>
      )}
      {isMine && username && (
        <span className="rounded-full border border-rule px-1.5 py-0.5 text-[8px] font-semibold text-faint">
          {lang === 'zh' ? '你' : 'you'}
        </span>
      )}
      {badges.includes('waseda-verified') && <WasedaVerifiedBadge compact />}
    </span>
  );
}
