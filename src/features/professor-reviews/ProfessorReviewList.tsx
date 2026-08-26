'use client';

import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n/LanguageProvider';
import {
  ProfessorReview,
  ReviewSort,
  ReviewVoteValue,
  StudentLevel,
} from './model';

interface ProfessorReviewListProps {
  reviews: ProfessorReview[];
  myReviewId?: number;
  busyReviewId?: number | null;
  onEdit: () => void;
  onVote: (review: ProfessorReview, value: ReviewVoteValue) => void;
  onReport: (review: ProfessorReview) => void;
}

export default function ProfessorReviewList({
  reviews,
  myReviewId,
  busyReviewId,
  onEdit,
  onVote,
  onReport,
}: ProfessorReviewListProps) {
  const { lang, t } = useI18n();
  const [sort, setSort] = useState<ReviewSort>('newest');
  const [studentLevel, setStudentLevel] = useState<StudentLevel | 'all'>('all');

  const visibleReviews = useMemo(() => {
    const filtered = studentLevel === 'all'
      ? reviews
      : reviews.filter((review) => review.studentLevel === studentLevel);
    return [...filtered].sort((a, b) => {
      if (sort === 'helpful') return b.helpfulCount - a.helpfulCount || Date.parse(b.createdAt) - Date.parse(a.createdAt);
      if (sort === 'highest') return b.overallRating - a.overallRating || Date.parse(b.createdAt) - Date.parse(a.createdAt);
      if (sort === 'lowest') return a.overallRating - b.overallRating || Date.parse(b.createdAt) - Date.parse(a.createdAt);
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
  }, [reviews, sort, studentLevel]);

  const locale = lang === 'zh' ? 'zh-CN' : 'en-GB';
  const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });

  const selectClassName = 'rounded-lg border border-rule bg-panel px-3 py-2 text-xs text-muted outline-none focus:border-violet focus:ring-1 focus:ring-violet';

  return (
    <section className="mt-10" aria-labelledby="student-reviews-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-cyan">{t('review.community')}</p>
          <h2 id="student-reviews-title" className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {t('review.studentReviews')}
          </h2>
          <p className="mt-1 text-[10px] text-faint">{t('review.reviewCount', { n: reviews.length })}</p>
        </div>
        <div className="flex flex-col gap-2 min-[430px]:flex-row">
          <label className="sr-only" htmlFor="review-level-filter">{t('review.filterByLevel')}</label>
          <select
            id="review-level-filter"
            value={studentLevel}
            onChange={(event) => setStudentLevel(event.target.value as StudentLevel | 'all')}
            className={selectClassName}
          >
            <option value="all">{t('review.studentLevel.all')}</option>
            {['masters', 'doctoral', 'researchStudent', 'other'].map((value) => (
              <option key={value} value={value}>{t(`review.studentLevel.${value}`)}</option>
            ))}
          </select>
          <label className="sr-only" htmlFor="review-sort">{t('review.sort.label')}</label>
          <select
            id="review-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as ReviewSort)}
            className={selectClassName}
          >
            {['newest', 'helpful', 'highest', 'lowest'].map((value) => (
              <option key={value} value={value}>{t(`review.sort.${value}`)}</option>
            ))}
          </select>
        </div>
      </div>

      {visibleReviews.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-rule bg-panel px-6 py-14 text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-faint">COMMUNITY / 00</p>
          <h3 className="mt-4 text-sm font-semibold text-foreground">
            {reviews.length === 0 ? t('review.emptyTitle') : t('review.filterEmptyTitle')}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-faint">
            {reviews.length === 0 ? t('review.emptyDesc') : t('review.filterEmptyDesc')}
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {visibleReviews.map((review) => {
            const isMine = review.id === myReviewId;
            const isBusy = review.id === busyReviewId;
            const contextLabels = [
              review.studentLevel ? t(`review.studentLevel.${review.studentLevel}`) : null,
              review.relationshipStatus ? t(`review.relationship.${review.relationshipStatus}`) : null,
              review.communicationLanguage ? t(`review.language.${review.communicationLanguage}`) : null,
            ].filter((label): label is string => label !== null);
            return (
              <article key={review.id} className="overflow-hidden rounded-xl border border-rule bg-panel">
                <div className="grid md:grid-cols-[130px_1fr]">
                  <div className="grid grid-cols-2 gap-px border-b border-rule bg-rule md:grid-cols-1 md:border-b-0 md:border-r">
                    <div className="bg-panel-raised p-4 text-center md:py-5">
                      <div className="text-2xl font-bold tabular-nums text-violet-300">{review.overallRating.toFixed(1)}</div>
                      <div className="mt-1 text-[8px] font-bold uppercase tracking-wide text-faint">{t('review.quality')}</div>
                    </div>
                    <div className="bg-panel-raised p-4 text-center md:py-5">
                      <div className="text-2xl font-bold tabular-nums text-cyan">{review.pressureRating.toFixed(1)}</div>
                      <div className="mt-1 text-[8px] font-bold uppercase tracking-wide text-faint">{t('review.pressure')}</div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-rule pb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted">
                          {contextLabels.length > 0 ? contextLabels.map((label, index) => (
                            <span key={`${index}-${label}`} className="contents">
                              {index > 0 && <span className="text-rule">/</span>}
                              <span>{label}</span>
                            </span>
                          )) : (
                            <span>{t('review.contextUndisclosed')}</span>
                          )}
                        </div>
                        <p className="mt-1.5 text-[9px] text-faint">
                          {dateFormatter.format(new Date(review.createdAt))}
                          {review.updatedAt !== review.createdAt ? ` · ${t('review.edited')}` : ''}
                        </p>
                      </div>
                      <div className={`rounded-full border px-3 py-1 text-[9px] font-medium ${
                        review.wouldChooseAgain
                          ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
                          : 'border-rule bg-background text-faint'
                      }`}>
                        {review.wouldChooseAgain ? t('review.chooseAgainYes') : t('review.chooseAgainNo')}
                      </div>
                    </div>

                    {review.comment && (
                      <p className="whitespace-pre-wrap break-words py-5 text-sm leading-7 text-muted">{review.comment}</p>
                    )}

                    {review.tags.length > 0 && (
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {review.tags.map((tag) => (
                          <span key={tag} className="text-[10px] font-medium text-violet-300">#{t(`review.tags.${tag}`)}</span>
                        ))}
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
                      <div className="flex items-center gap-2">
                        <span className="mr-1 text-[10px] text-faint">{t('review.helpfulQuestion')}</span>
                        <button
                          type="button"
                          onClick={() => onVote(review, 1)}
                          disabled={isBusy}
                          aria-pressed={review.viewerVote === 1}
                          className={`rounded-md border px-2.5 py-1.5 text-[10px] font-semibold disabled:opacity-50 ${
                            review.viewerVote === 1
                              ? 'border-violet bg-violet text-white'
                              : 'border-rule text-faint hover:text-foreground'
                          }`}
                        >
                          ↑ {review.helpfulCount}
                        </button>
                        <button
                          type="button"
                          onClick={() => onVote(review, -1)}
                          disabled={isBusy}
                          aria-pressed={review.viewerVote === -1}
                          className={`rounded-md border px-2.5 py-1.5 text-[10px] font-semibold disabled:opacity-50 ${
                            review.viewerVote === -1
                              ? 'border-rule bg-rule text-foreground'
                              : 'border-rule text-faint hover:text-foreground'
                          }`}
                        >
                          ↓ {review.unhelpfulCount}
                        </button>
                      </div>
                      {isMine ? (
                        <button type="button" onClick={onEdit} className="text-[10px] font-semibold text-violet-300 hover:text-violet-200">
                          {t('review.editMine')}
                        </button>
                      ) : (
                        <button type="button" onClick={() => onReport(review)} className="text-[10px] text-faint hover:text-red-400">
                          {t('review.report')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
