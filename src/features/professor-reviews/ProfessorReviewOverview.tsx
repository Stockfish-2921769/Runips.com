'use client';

import { useI18n } from '@/i18n/LanguageProvider';
import { ProfessorReviewSummary, REVIEW_DIMENSION_KEYS } from './model';

interface ProfessorReviewOverviewProps {
  summary: ProfessorReviewSummary;
}

function MetricCard({ value, label, note }: { value: string; label: string; note?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-rule bg-background/45 px-4 py-4">
      <div className="text-xl font-bold tracking-tight tabular-nums text-foreground sm:text-2xl">{value}</div>
      <div className="mt-1 text-[10px] font-medium text-muted">{label}</div>
      {note && <div className="mt-1 text-[9px] text-faint">{note}</div>}
    </div>
  );
}

export default function ProfessorReviewOverview({ summary }: ProfessorReviewOverviewProps) {
  const { t, dimensions } = useI18n();
  const hasReviews = summary.reviewCount > 0;
  const maxDistribution = Math.max(...Object.values(summary.ratingDistribution), 1);

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-xl border border-rule bg-panel" aria-labelledby="review-overview-title">
        <div className="grid lg:grid-cols-[220px_1fr_300px]">
          <div className="flex flex-col justify-center border-b border-rule p-6 text-center lg:border-b-0 lg:border-r">
            <p id="review-overview-title" className="text-[9px] font-bold uppercase tracking-[0.16em] text-faint">{t('review.overallQuality')}</p>
            <div className="mt-3 flex items-end justify-center gap-1">
              <span className={`text-5xl font-extrabold leading-none tracking-[-0.05em] tabular-nums ${summary.overallAverage === null ? 'text-faint' : 'gradient-text'}`}>
                {summary.overallAverage?.toFixed(1) ?? '—'}
              </span>
              <span className="mb-1 text-sm font-semibold text-faint">/ 5</span>
            </div>
            <p className="mt-3 text-[10px] text-faint">
              {hasReviews ? t('review.basedOn', { n: summary.reviewCount }) : t('review.noReviews')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 border-b border-rule p-5 lg:border-b-0 lg:border-r">
            <MetricCard
              value={summary.wouldChooseAgainPercent === null ? '—' : `${summary.wouldChooseAgainPercent}%`}
              label={t('review.wouldChooseAgainShort')}
            />
            <MetricCard
              value={summary.pressureAverage?.toFixed(1) ?? '—'}
              label={t('review.pressure')}
              note={t('review.pressureNote')}
            />
          </div>

          <div className="p-5">
            <h3 className="text-[9px] font-bold uppercase tracking-[0.16em] text-faint">{t('review.distribution')}</h3>
            <div className="mt-4 space-y-2.5">
              {[5, 4, 3, 2, 1].map((score) => {
                const count = summary.ratingDistribution[score as 1 | 2 | 3 | 4 | 5];
                return (
                  <div key={score} className="grid grid-cols-[18px_1fr_22px] items-center gap-2 text-[10px]">
                    <span className="font-semibold text-muted">{score}</span>
                    <div className="h-1.5 overflow-hidden rounded-full bg-rule">
                      <div className="h-full rounded-full bg-violet" style={{ width: `${(count / maxDistribution) * 100}%` }} />
                    </div>
                    <span className="text-right tabular-nums text-faint">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {summary.topTags.length > 0 && (
          <div className="border-t border-rule px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <h3 className="text-[9px] font-bold uppercase tracking-[0.16em] text-faint">{t('review.topTags')}</h3>
              {summary.topTags.map(({ tag, count }) => (
                <span key={tag} className="text-[10px] font-medium text-violet-300">
                  #{t(`review.tags.${tag}`)} <span className="text-faint">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-rule bg-panel p-5 sm:p-6" aria-labelledby="mentor-dimensions-title">
        <div className="max-w-2xl">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-cyan">{t('review.researchMentorship')}</p>
          <h2 id="mentor-dimensions-title" className="mt-2 text-xl font-bold text-foreground">{t('review.dimensionsTitle')}</h2>
          <p className="mt-2 text-xs leading-6 text-faint">{t('review.dimensionsIntro')}</p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dimensions.map((dimension, index) => {
            const value = summary.dimensionAverages[REVIEW_DIMENSION_KEYS[index]];
            return (
              <div key={REVIEW_DIMENSION_KEYS[index]} className="rounded-lg border border-rule bg-background/45 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-muted">{dimension.label}</span>
                  <span className="text-xs font-bold tabular-nums text-cyan">{value?.toFixed(1) ?? '—'}</span>
                </div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-rule">
                  <div className="h-full rounded-full bg-cyan" style={{ width: value ? `${(value / 5) * 100}%` : '0%' }} />
                </div>
                <p className="mt-3 text-[10px] leading-5 text-faint">{dimension.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
