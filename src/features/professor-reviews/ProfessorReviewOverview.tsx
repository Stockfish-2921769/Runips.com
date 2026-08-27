'use client';

import { useI18n } from '@/i18n/LanguageProvider';
import ProfessorHexagon from '@/components/ProfessorHexagon';
import { ProfessorReviewSummary, REVIEW_DIMENSION_KEYS, pressureBandIndex } from './model';

interface ProfessorReviewOverviewProps {
  summary: ProfessorReviewSummary;
}

function MetricCard({
  value,
  valueSuffix,
  label,
  note,
}: { value: string; valueSuffix?: string; label: string; note?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-rule bg-background/45 px-4 py-4">
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-bold tracking-tight tabular-nums text-foreground sm:text-2xl">{value}</span>
        {valueSuffix && <span className="text-xs font-semibold text-cyan">{valueSuffix}</span>}
      </div>
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
            {/* The number alone repeats the problem the form had: on a page where
                every other figure means "higher is better", a bare 4.0 reads as
                a grade. The caption is the same word the reviewer picked. */}
            <MetricCard
              value={summary.pressureAverage?.toFixed(1) ?? '—'}
              valueSuffix={
                summary.pressureAverage === null
                  ? undefined
                  : t(`review.pressureScale.${pressureBandIndex(summary.pressureAverage)}`)
              }
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

        {/* The radar shows the shape of the profile; the list beside it carries
            the exact numbers, which area alone cannot convey. */}
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          <div className="flex justify-center lg:justify-start">
            <ProfessorHexagon
              values={REVIEW_DIMENSION_KEYS.map((key) => summary.dimensionAverages[key])}
              labels={dimensions.map((dimension) => dimension.label)}
              max={5}
              emptyLabel={t('review.noDimensionData')}
              ariaLabel={t('review.dimensionsTitle')}
            />
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            {dimensions.map((dimension, index) => {
              const key = REVIEW_DIMENSION_KEYS[index];
              const value = summary.dimensionAverages[key];
              const ratedBy = summary.dimensionCounts[key];
              return (
                <div key={key} className="rounded-lg border border-rule bg-background/45 p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-xs font-semibold text-muted">{dimension.label}</dt>
                    <dd className={`text-sm font-bold tabular-nums ${value === null ? 'text-faint' : 'text-cyan'}`}>
                      {value?.toFixed(1) ?? '—'}
                      <span className="ml-0.5 text-[10px] font-normal text-faint">/5</span>
                    </dd>
                  </div>
                  {/* Reviewers who marked this one not applicable are excluded, so
                      the headline review count would overstate it. Say who
                      actually rated this dimension instead. */}
                  <p className="mt-1 text-[9px] text-faint">
                    {ratedBy > 0 ? t('review.dimensionRatedBy', { n: ratedBy }) : t('review.dimensionNotRated')}
                  </p>
                  <p className="mt-2 text-[10px] leading-5 text-faint">{dimension.desc}</p>
                </div>
              );
            })}
          </dl>
        </div>
      </section>
    </div>
  );
}
