'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useI18n } from '@/i18n/LanguageProvider';

interface ReviewPrivacyNoticeProps {
  professorName: string;
  onClose: () => void;
  onContinue: () => void;
}

export default function ReviewPrivacyNotice({
  professorName,
  onClose,
  onContinue,
}: ReviewPrivacyNoticeProps) {
  const { t } = useI18n();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/80 px-4 py-8"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-privacy-title"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-rule bg-panel"
      >
        <div className="flex items-start justify-between gap-4 border-b border-rule px-5 py-5 sm:px-6">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan">{t('review.privacyNotice.eyebrow')}</p>
            <h2 id="review-privacy-title" className="mt-2 text-xl font-bold text-foreground">
              {t('review.privacyNotice.title')}
            </h2>
            <p className="mt-1 text-xs text-faint">{professorName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-faint hover:bg-rule hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet"
            aria-label={t('review.privacyNotice.close')}
          >
            ×
          </button>
        </div>

        <div className="px-5 py-6 sm:px-6">
          {/* One paragraph rather than a numbered list. This dialog stands
              between someone and the thing they came to do, and a four-item
              checklist is read by nobody — which defeats the point of showing
              it at all. */}
          <p className="text-sm leading-7 text-muted">{t('review.privacyNotice.body')}</p>

          <p className="mt-5 text-[11px] leading-6 text-faint">
            {t('review.privacyNotice.readMore')}{' '}
            <Link href="/privacy" target="_blank" className="font-semibold text-violet-300 hover:text-violet-200">{t('legal.privacy')}</Link>
            <span aria-hidden="true"> · </span>
            <Link href="/terms" target="_blank" className="font-semibold text-violet-300 hover:text-violet-200">{t('legal.terms')}</Link>
          </p>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-rule pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-rule px-5 py-2.5 text-sm font-semibold text-muted hover:bg-rule hover:text-foreground"
            >
              {t('review.privacyNotice.cancel')}
            </button>
            <button
              type="button"
              onClick={onContinue}
              autoFocus
              className="gradient-button rounded-lg px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              {t('review.privacyNotice.continue')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
