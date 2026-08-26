'use client';

import { ReactNode } from 'react';
import { useI18n } from '@/i18n/LanguageProvider';
import { getCommunityCopy } from './copy';

interface CommunityStateProps {
  kind: 'loading' | 'error' | 'unavailable' | 'empty';
  title?: string;
  description?: string;
  action?: ReactNode;
}

export default function CommunityState({
  kind,
  title,
  description,
  action,
}: CommunityStateProps) {
  const { lang } = useI18n();
  const copy = getCommunityCopy(lang);

  const defaultTitle = kind === 'error'
    ? copy.state.loadFailedTitle
    : kind === 'unavailable'
      ? copy.state.unavailableTitle
      : title;
  const defaultDescription = kind === 'error'
    ? copy.state.loadFailedDescription
    : kind === 'unavailable'
      ? copy.state.unavailableDescription
      : description;

  if (kind === 'loading') {
    return (
      <div className="rounded-xl border border-rule bg-panel px-5 py-20 text-center text-sm text-faint" role="status">
        {copy.state.loading}
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-dashed border-rule bg-panel px-6 py-14 text-center">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-faint">COMMUNITY / 00</p>
      {defaultTitle && <h2 className="mt-4 text-lg font-bold text-foreground">{defaultTitle}</h2>}
      {defaultDescription && (
        <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-faint">{defaultDescription}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </section>
  );
}
