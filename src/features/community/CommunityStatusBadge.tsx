'use client';

import { useI18n } from '@/i18n/LanguageProvider';
import { getCommunityCopy } from './copy';
import { CommunityTopicStatus } from './model';

const STATUS_STYLES: Record<CommunityTopicStatus, string> = {
  open: 'border-rule bg-background text-muted',
  resolved: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  duplicate: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  closed: 'border-rule bg-rule/40 text-faint',
  locked: 'border-red-500/25 bg-red-500/10 text-red-300',
  hidden: 'border-red-500/25 bg-red-500/10 text-red-300',
  deleted: 'border-rule bg-rule/40 text-faint',
};

export default function CommunityStatusBadge({ status }: { status: CommunityTopicStatus }) {
  const { lang } = useI18n();
  const copy = getCommunityCopy(lang);

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${STATUS_STYLES[status]}`}>
      {copy.status[status]}
    </span>
  );
}
