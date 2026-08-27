'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { PROFESSOR_EN } from '@/data/professorNames';
import ProfessorReviewForm from '@/features/professor-reviews/ProfessorReviewForm';
import ProfessorReviewList from '@/features/professor-reviews/ProfessorReviewList';
import ProfessorReviewOverview from '@/features/professor-reviews/ProfessorReviewOverview';
import ReviewPrivacyNotice from '@/features/professor-reviews/ReviewPrivacyNotice';
import {
  ProfessorReview,
  ProfessorReviewDraft,
  ProfessorReviewsSnapshot,
  ReviewVoteValue,
  emptyReviewSummary,
} from '@/features/professor-reviews/model';
import {
  getProfessorReviews,
  reportProfessorReview,
  saveProfessorReview,
  setProfessorReviewVote,
} from '@/features/professor-reviews/repository';
import { useI18n } from '@/i18n/LanguageProvider';
import { supabase } from '@/lib/supabase';
import { getGoogleScholarSearchUrl } from '@/lib/scholar';
import { Professor } from '@/types';

export default function ProfessorDetail({ id }: { id: string }) {
  const professorId = Number(id);
  const validProfessorId = Number.isInteger(professorId) && professorId > 0;
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const { lang, t } = useI18n();

  const [professor, setProfessor] = useState<Professor | null>(null);
  const [pageLoading, setPageLoading] = useState(validProfessorId);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [privacyNoticeOpen, setPrivacyNoticeOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [busyReviewId, setBusyReviewId] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [snapshot, setSnapshot] = useState<ProfessorReviewsSnapshot>({
    reviews: [],
    myReview: null,
    summary: emptyReviewSummary(professorId),
    available: true,
  });

  const loginHref = `/login/?next=${encodeURIComponent(`/professors/${professorId}/`)}`;

  useEffect(() => {
    if (!validProfessorId) return;

    let mounted = true;
    supabase
      .from('professors')
      .select('*')
      .eq('id', professorId)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return;
        setProfessor(data ? (data as Professor) : null);
        setPageLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [professorId, validProfessorId]);

  // Records the visit that feeds `professor_ranking.score`. The RPC has always
  // existed and been granted to anon, but nothing called it, so `click_count`
  // never moved off its seed values. Fire-and-forget: a failed count must never
  // block the page, and the ranking tolerates a missed increment.
  useEffect(() => {
    if (!validProfessorId) return;
    void supabase.rpc('increment_clicks', { p_professor_id: professorId });
  }, [professorId, validProfessorId]);

  const refreshReviews = async () => {
    if (!validProfessorId) return;
    try {
      const nextSnapshot = await getProfessorReviews(professorId, userId);
      setSnapshot(nextSnapshot);
    } catch {
      setNotice(t('review.loadFailed'));
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !validProfessorId) return;
    let mounted = true;

    getProfessorReviews(professorId, userId)
      .then((nextSnapshot) => {
        if (mounted) setSnapshot(nextSnapshot);
      })
      .catch(() => {
        if (mounted) setNotice(t('review.loadFailed'));
      })
      .finally(() => {
        if (mounted) setReviewsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [authLoading, professorId, t, userId, validProfessorId]);

  const professorNames = useMemo(() => {
    if (!professor) return { displayName: '', displayLab: '' };
    const translated = PROFESSOR_EN[professor.id];
    const displayName =
      lang === 'en' && translated ? translated.nameEn
        : professor.name;
    const displayLab = lang === 'en' && translated?.labEn
      ? translated.labEn
      : professor.lab || t('common.labUnknown');
    return { displayName, displayLab };
  }, [lang, professor, t]);

  const handleSave = async (draft: ProfessorReviewDraft) => {
    if (!user || !snapshot.available) throw new Error('Review module unavailable');
    await saveProfessorReview(professorId, draft);
    await refreshReviews();
    setNotice(snapshot.myReview ? t('review.updatedSuccess') : t('review.publishedSuccess'));
  };

  const handleVote = async (review: ProfessorReview, value: ReviewVoteValue) => {
    if (!user) {
      window.location.href = loginHref;
      return;
    }

    const nextVote = review.viewerVote === value ? null : value;
    setBusyReviewId(review.id);
    setNotice('');
    try {
      await setProfessorReviewVote(review.id, nextVote);
      setSnapshot((current) => {
        const reviews = current.reviews.map((item) => {
          if (item.id !== review.id) return item;
          return {
            ...item,
            helpfulCount: item.helpfulCount - (item.viewerVote === 1 ? 1 : 0) + (nextVote === 1 ? 1 : 0),
            unhelpfulCount: item.unhelpfulCount - (item.viewerVote === -1 ? 1 : 0) + (nextVote === -1 ? 1 : 0),
            viewerVote: nextVote,
          };
        });
        const myReview = current.myReview?.id === review.id
          ? reviews.find((item) => item.id === review.id) ?? current.myReview
          : current.myReview;
        return { ...current, reviews, myReview };
      });
    } catch {
      setNotice(t('review.actionFailed'));
    } finally {
      setBusyReviewId(null);
    }
  };

  const handleReport = async (review: ProfessorReview) => {
    if (!user) {
      window.location.href = loginHref;
      return;
    }
    if (!window.confirm(t('review.reportConfirm'))) return;

    setBusyReviewId(review.id);
    try {
      await reportProfessorReview(review.id, 'community_guidelines');
      setNotice(t('review.reported'));
    } catch {
      setNotice(t('review.actionFailed'));
    } finally {
      setBusyReviewId(null);
    }
  };

  if (pageLoading) {
    return (
      <div className="hero-grid mx-auto min-h-[60vh] px-4 py-20 text-center text-sm text-faint">
        {t('common.loading')}
      </div>
    );
  }

  if (!professor) {
    return (
      <div className="hero-grid min-h-[60vh] px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">{t('detail.notFound')}</h1>
        <Link href="/" className="mt-4 inline-block text-sm font-semibold text-violet-400 hover:text-violet-300">
          {t('detail.back')}
        </Link>
      </div>
    );
  }

  const { displayName, displayLab } = professorNames;
  const divisionLabel = t(`division.${professor.division}`) || professor.division;
  const officialUrl = PROFESSOR_EN[professor.id]?.officialUrl;
  const scholarUrl = getGoogleScholarSearchUrl(professor.id, displayName);
  const citationUpdatedDate = professor.citations_updated_at
    ? new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(professor.citations_updated_at))
    : null;
  const openReviewFlow = () => setPrivacyNoticeOpen(true);
  const rateAction = !snapshot.available && !reviewsLoading ? (
    <button
      type="button"
      disabled
      className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-rule bg-panel-raised px-5 py-3 text-sm font-semibold text-faint"
    >
      {t('review.rateProfessor')}
    </button>
  ) : user ? (
    <button
      type="button"
      onClick={openReviewFlow}
      disabled={!snapshot.available}
      className="gradient-button inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {snapshot.myReview ? t('review.editReview') : t('review.rateProfessor')}
    </button>
  ) : (
    <Link
      href={loginHref}
      className="gradient-button inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
    >
      {t('review.rateProfessor')}
    </Link>
  );

  return (
    <div className="hero-grid">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-[11px] text-faint hover:text-foreground">
          {t('detail.back')}
        </Link>

        <header className="mt-5 overflow-hidden rounded-2xl border border-rule bg-panel">
          <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="flex min-w-0 items-start gap-4 sm:gap-5">
              <div className="gradient-button flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xl font-extrabold text-white sm:h-16 sm:w-16 sm:text-2xl">
                {displayName[0]}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-violet/30 bg-violet/10 px-2.5 py-1 text-[9px] font-medium text-violet-300">
                    {divisionLabel}
                  </span>
                  <span className="text-[10px] text-faint">{t('review.unofficial')}</span>
                </div>
                <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">{displayName}</h1>
                <p className="mt-2 text-xs text-muted sm:text-sm">{displayLab}</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
              {officialUrl && (
                <a
                  href={officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-rule bg-background px-4 py-3 text-sm font-semibold text-muted hover:border-violet/60 hover:text-foreground"
                >
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M14 4h6v6m0-6L10 14M5 7v12h12v-5" />
                  </svg>
                  {t('detail.officialProfile')}
                </a>
              )}
              {rateAction}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-px border-t border-rule bg-rule">
            <a
              href={scholarUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-panel-raised px-4 py-3 text-center hover:bg-panel"
              title={t('stats.citationSource')}
            >
              <div className="text-sm font-bold tabular-nums text-foreground">{professor.scholar_citations ?? t('common.tbd')}</div>
              <div className="mt-1 text-[8px] uppercase tracking-wider text-faint">{t('stats.citations')}</div>
              {citationUpdatedDate && (
                <div className="mt-1 text-[8px] text-faint">{t('stats.citationUpdated', { date: citationUpdatedDate })}</div>
              )}
              <div className="mt-1 text-[8px] font-semibold text-violet-300">{t('stats.scholar')}</div>
            </a>
            <div className="bg-panel-raised px-4 py-3 text-center">
              <div className="text-sm font-bold tabular-nums text-foreground">
                {snapshot.summary.overallAverage?.toFixed(1) ?? '—'}
              </div>
              <div className="mt-1 text-[8px] uppercase tracking-wider text-faint">{t('review.overall')}</div>
            </div>
            <div className="bg-panel-raised px-4 py-3 text-center">
              <div className="text-sm font-bold tabular-nums text-foreground">{snapshot.summary.reviewCount}</div>
              <div className="mt-1 text-[8px] uppercase tracking-wider text-faint">{t('review.studentReviews')}</div>
            </div>
          </div>
        </header>

        {notice && (
          <div className="mt-5 rounded-lg border border-violet/30 bg-violet/10 px-4 py-3 text-sm font-medium text-violet-200" role="status">
            {notice}
          </div>
        )}

        {!snapshot.available && !reviewsLoading && (
          <div className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {t('review.moduleUnavailable')}
          </div>
        )}

        <div className="mt-5">
          {reviewsLoading ? (
            <div className="rounded-xl border border-rule bg-panel py-24 text-center text-xs text-faint" aria-label={t('common.loading')}>
              {t('common.loading')}
            </div>
          ) : (
            <>
              <ProfessorReviewOverview summary={snapshot.summary} />
              <ProfessorReviewList
                reviews={snapshot.reviews}
                myReviewId={snapshot.myReview?.id}
                busyReviewId={busyReviewId}
                onEdit={openReviewFlow}
                onVote={handleVote}
                onReport={handleReport}
              />
            </>
          )}
        </div>

        <aside className="mt-6 rounded-xl border border-rule bg-panel px-5 py-4 text-xs leading-6 text-faint">
          <span className="font-semibold text-muted">{t('review.guidelinesTitle')}</span>{' '}
          {t('review.guidelinesSummary')}
        </aside>

        {user && privacyNoticeOpen && (
          <ReviewPrivacyNotice
            professorName={displayName}
            onClose={() => setPrivacyNoticeOpen(false)}
            onContinue={() => {
              setPrivacyNoticeOpen(false);
              setFormOpen(true);
            }}
          />
        )}

        {user && formOpen && (
          <ProfessorReviewForm
            professorName={displayName}
            initialReview={snapshot.myReview}
            onClose={() => setFormOpen(false)}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}
