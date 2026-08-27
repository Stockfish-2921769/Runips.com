'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useI18n } from '@/i18n/LanguageProvider';
import RatingSelector from './RatingSelector';
import {
  EMPTY_REVIEW_DRAFT,
  ProfessorReview,
  ProfessorReviewDraft,
  DimensionRating,
  REVIEW_DIMENSION_KEYS,
  isDimensionAnswered,
  REVIEW_TAGS,
  ReviewTag,
  reviewToDraft,
} from './model';

interface ProfessorReviewFormProps {
  professorName: string;
  initialReview: ProfessorReview | null;
  onClose: () => void;
  onSave: (draft: ProfessorReviewDraft) => Promise<void>;
}

export default function ProfessorReviewForm({
  professorName,
  initialReview,
  onClose,
  onSave,
}: ProfessorReviewFormProps) {
  const { t, dimensions } = useI18n();
  const [draft, setDraft] = useState<ProfessorReviewDraft>(() =>
    initialReview ? reviewToDraft(initialReview) : { ...EMPTY_REVIEW_DRAFT, tags: [] },
  );
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, submitting]);

  const dimensionFields: Record<(typeof REVIEW_DIMENSION_KEYS)[number], keyof ProfessorReviewDraft> = {
    supervision: 'supervisionRating',
    communication: 'communicationRating',
    autonomy: 'autonomyRating',
    labCulture: 'labCultureRating',
    researchSupport: 'researchSupportRating',
    careerSupport: 'careerSupportRating',
  };

  const toggleTag = (tag: ReviewTag) => {
    setDraft((current) => {
      if (current.tags.includes(tag)) {
        return { ...current, tags: current.tags.filter((item) => item !== tag) };
      }
      if (current.tags.length >= 3) return current;
      return { ...current, tags: [...current.tags, tag] };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    // Overall and pressure are the two things every reviewer can answer, so they
    // stay mandatory. Each dimension needs a deliberate choice too, but "not
    // applicable" counts as one — what is rejected is leaving it untouched.
    const requiredRatings = [draft.overallRating, draft.pressureRating];
    const dimensionsAnswered = REVIEW_DIMENSION_KEYS.every((key) =>
      isDimensionAnswered(draft[dimensionFields[key]] as DimensionRating),
    );
    if (
      requiredRatings.some((rating) => rating < 1 || rating > 5) ||
      !dimensionsAnswered ||
      draft.wouldChooseAgain === null ||
      draft.tags.length > 3
    ) {
      setError(t('review.form.completeAll'));
      return;
    }
    if (draft.comment.trim().length > 2000) {
      setError(t('review.form.commentTooLong'));
      return;
    }
    if (!agreed) {
      setError(t('review.form.acceptGuidelines'));
      return;
    }

    setSubmitting(true);
    try {
      await onSave({ ...draft, comment: draft.comment.trim() });
      onClose();
    } catch {
      setError(t('review.form.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-black/80 px-4 py-6 sm:py-10"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="professor-review-title"
        className="mx-auto w-full max-w-3xl overflow-hidden rounded-xl border border-rule bg-panel"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-rule bg-panel px-5 py-4 sm:px-7">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan">{t('review.form.eyebrow')}</p>
            <h2 id="professor-review-title" className="mt-2 text-xl font-bold text-foreground">
              {initialReview ? t('review.form.editTitle') : t('review.form.title')} · {professorName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-faint hover:bg-rule hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet"
            aria-label={t('review.form.close')}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 px-5 py-6 sm:px-7">
          <div className="rounded-lg border border-violet/30 bg-violet/10 p-4 text-xs leading-6 text-violet-200">
            {t('review.form.privacyNote')}
          </div>

          <section aria-labelledby="review-dimensions-heading">
            <div>
              <h3 id="review-dimensions-heading" className="text-sm font-bold text-foreground">{t('review.form.dimensionsSection')}</h3>
              <p className="mt-1 text-xs text-faint">{t('review.form.dimensionsHint')}</p>
            </div>
            <div className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2">
              {REVIEW_DIMENSION_KEYS.map((key, index) => {
                const field = dimensionFields[key];
                return (
                  <RatingSelector
                    key={key}
                    id={`dimension-${key}`}
                    label={dimensions[index].label}
                    description={dimensions[index].desc}
                    value={draft[field] as DimensionRating}
                    allowNotApplicable
                    notApplicableLabel={t('review.form.notApplicable')}
                    onChange={(value) => setDraft((current) => ({ ...current, [field]: value }))}
                  />
                );
              })}
            </div>
          </section>

          <section aria-labelledby="review-tags-heading">
            <div className="flex items-baseline justify-between gap-3">
              <h3 id="review-tags-heading" className="text-sm font-bold text-foreground">{t('review.form.tagsSection')}</h3>
              <span className="text-xs text-faint">{draft.tags.length}/3</span>
            </div>
            <p className="mt-1 text-xs text-faint">{t('review.form.tagsHint')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {REVIEW_TAGS.map((tag) => {
                const selected = draft.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleTag(tag)}
                    disabled={!selected && draft.tags.length >= 3}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-35 ${
                      selected
                        ? 'border-violet bg-violet text-white'
                        : 'border-rule bg-background text-faint hover:text-foreground'
                    }`}
                  >
                    {t(`review.tags.${tag}`)}
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="review-comment-heading">
            <div className="flex items-baseline justify-between gap-3">
              <h3 id="review-comment-heading" className="text-sm font-bold text-foreground">{t('review.form.commentSection')}</h3>
              <span className={`text-xs ${draft.comment.length > 2000 ? 'text-red-400' : 'text-faint'}`}>
                {draft.comment.length}/2000
              </span>
            </div>
            <p className="mt-1 text-xs text-faint">{t('review.form.commentHint')}</p>
            <textarea
              value={draft.comment}
              onChange={(event) => setDraft((current) => ({ ...current, comment: event.target.value }))}
              maxLength={2000}
              rows={7}
              placeholder={t('review.form.commentPlaceholder')}
              className="mt-3 w-full resize-y rounded-lg border border-rule bg-background px-4 py-3 text-sm leading-7 text-muted outline-none placeholder:text-faint focus:border-violet focus:ring-1 focus:ring-violet"
            />
          </section>

          <section aria-labelledby="review-overall-heading">
            <h3 id="review-overall-heading" className="text-sm font-bold text-foreground">{t('review.form.overallSection')}</h3>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <RatingSelector
                id="overall-rating"
                label={t('review.overall')}
                description={t('review.form.overallDesc')}
                value={draft.overallRating}
                lowLabel={t('review.scale.poor')}
                highLabel={t('review.scale.excellent')}
                onChange={(overallRating) => setDraft((current) => ({ ...current, overallRating }))}
              />
              {/* Words rather than 1–5, and cyan rather than violet: this is the
                  one rating on the form where a high number is not a good
                  score, and it sat here looking exactly like the ones where it
                  is. Cyan is what the review list already uses for pressure. */}
              <RatingSelector
                id="pressure-rating"
                label={t('review.pressure')}
                description={t('review.form.pressureDesc')}
                value={draft.pressureRating}
                optionLabels={[
                  t('review.pressureScale.0'),
                  t('review.pressureScale.1'),
                  t('review.pressureScale.2'),
                  t('review.pressureScale.3'),
                  t('review.pressureScale.4'),
                ]}
                tone="neutral"
                onChange={(pressureRating) => setDraft((current) => ({ ...current, pressureRating }))}
              />
            </div>

            <fieldset className="mt-6">
              <legend className="text-xs font-semibold text-muted">{t('review.wouldChooseAgain')}</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:max-w-sm">
                {[true, false].map((value) => (
                  <button
                    key={String(value)}
                    type="button"
                    aria-pressed={draft.wouldChooseAgain === value}
                    onClick={() => setDraft((current) => ({ ...current, wouldChooseAgain: value }))}
                    className={`rounded-lg border px-4 py-2.5 text-sm font-semibold ${
                      draft.wouldChooseAgain === value
                        ? 'border-violet bg-violet text-white'
                        : 'border-rule bg-background text-muted hover:text-foreground'
                    }`}
                  >
                    {value ? t('common.yes') : t('common.no')}
                  </button>
                ))}
              </div>
            </fieldset>
          </section>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-rule bg-background/45 p-4 text-xs leading-relaxed text-faint">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-rule bg-background text-violet focus:ring-violet"
            />
            <span>
              {t('review.form.guidelines')}
              <span className="mt-2 block">
                <Link href="/terms" target="_blank" className="font-semibold text-violet-300 hover:text-violet-200">{t('legal.terms')}</Link>
                <span aria-hidden="true"> · </span>
                <Link href="/privacy" target="_blank" className="font-semibold text-violet-300 hover:text-violet-200">{t('legal.privacy')}</Link>
              </span>
            </span>
          </label>

          {error && <p className="text-sm font-medium text-red-400" role="alert">{error}</p>}

          <div className="flex flex-col-reverse gap-3 border-t border-rule pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-rule px-5 py-2.5 text-sm font-semibold text-muted hover:bg-rule hover:text-foreground disabled:opacity-50"
            >
              {t('review.form.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="gradient-button rounded-lg px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? t('review.form.submitting') : initialReview ? t('review.form.update') : t('review.form.publish')}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
