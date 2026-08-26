'use client';

import Link from 'next/link';
import { Professor } from '@/types';
import { PROFESSOR_EN } from '@/data/professorNames';
import { useI18n } from '@/i18n/LanguageProvider';
import { ProfessorReviewSummary } from '@/features/professor-reviews/model';

interface ProfessorDirectoryRowProps {
  item: Professor;
  reviewSummary?: ProfessorReviewSummary;
}

export default function ProfessorDirectoryRow({ item, reviewSummary }: ProfessorDirectoryRowProps) {
  const { lang, t } = useI18n();
  const divisionLabel = t(`division.${item.division}` as never) || item.division;
  const translated = PROFESSOR_EN[item.id];
  const displayName =
    lang === 'en' && translated ? translated.nameEn :
    item.name;
  const displayLab = lang === 'en' && translated?.labEn ? translated.labEn : item.lab || t('common.labUnknown');
  const officialUrl = translated?.officialUrl;
  const hasReviews = (reviewSummary?.reviewCount ?? 0) > 0;
  const chooseAgain = reviewSummary?.wouldChooseAgainPercent;

  return (
    <div className="group grid grid-cols-[36px_minmax(0,1fr)_64px] items-center gap-3 border-b border-rule px-3 py-3 last:border-b-0 hover:bg-panel-raised md:grid-cols-[52px_minmax(0,1fr)_100px_100px_100px_64px] md:px-4">
      <span className="text-center font-mono text-[11px] tabular-nums text-faint">{String(item.id).padStart(2, '0')}</span>

      <Link href={`/professors/${item.id}`} className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rule bg-background text-[11px] font-bold text-muted group-hover:border-violet/60 group-hover:text-foreground">
          {displayName[0]}
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-xs font-semibold text-foreground group-hover:text-cyan sm:text-sm">{displayName}</h3>
            <span className="hidden shrink-0 text-[9px] text-faint lg:inline">{divisionLabel}</span>
          </div>
          <p className="mt-1 truncate text-[10px] text-faint">{displayLab}</p>
          <div className="mt-1.5 flex items-center gap-3 text-[9px] text-faint md:hidden">
            <span>{t('review.overall')} {reviewSummary?.overallAverage?.toFixed(1) ?? '—'}</span>
            <span>{t('stats.citations')} {item.scholar_citations ?? t('common.tbd')}</span>
            <span>{t('review.wouldChooseAgainShort')} {chooseAgain === null || chooseAgain === undefined ? '—' : `${chooseAgain}%`}</span>
          </div>
        </div>
      </Link>

      <div className="hidden text-center md:block">
        <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-1.5 text-[10px] font-bold tabular-nums ${
          hasReviews
            ? 'border-violet/40 bg-violet/15 text-violet-300'
            : 'border-rule bg-background text-faint'
        }`}>
          {reviewSummary?.overallAverage?.toFixed(1) ?? '—'}
        </span>
        <span className="mt-1 block text-[8px] text-faint">{t('review.reviewCount', { n: reviewSummary?.reviewCount ?? 0 })}</span>
      </div>

      <div className="hidden text-center md:block">
        <span className="text-xs font-semibold tabular-nums text-emerald-400" title={t('stats.citationSource')}>{item.scholar_citations ?? '—'}</span>
      </div>

      <div className="hidden text-center md:block">
        <span className="text-xs font-semibold tabular-nums text-cyan">
          {chooseAgain === null || chooseAgain === undefined ? '—' : `${chooseAgain}%`}
        </span>
      </div>

      <div className="flex items-center justify-end gap-1">
        {officialUrl && (
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t('detail.officialProfile')}: ${displayName}`}
            title={t('detail.officialProfile')}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-rule bg-background text-faint hover:border-violet/60 hover:text-foreground"
          >
            <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 4h6v6m0-6L10 14M5 7v12h12v-5" />
            </svg>
          </a>
        )}
        <Link
          href={`/professors/${item.id}`}
          aria-label={`${t('detail.viewProfile')}: ${displayName}`}
          title={t('detail.viewProfile')}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-faint hover:bg-background hover:text-foreground"
        >
          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m9 5 7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
