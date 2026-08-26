'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useI18n } from '@/i18n/LanguageProvider';
import { getCommunityCopy } from './copy';
import CommunityFrame from './CommunityFrame';
import CommunityState from './CommunityState';
import CommunityStatusBadge from './CommunityStatusBadge';
import {
  COMMUNITY_LIMITS,
  CommunityCategory,
  CommunityTopicSummary,
  CreateCommunityTopicDraft,
  communityTopicHref,
} from './model';
import { communityCategoryName } from './presentation';
import {
  createCommunityTopic,
  getCommunityCategories,
  suggestCommunityTopics,
} from './repository';

type SimilarState = 'idle' | 'loading' | 'loaded' | 'unavailable' | 'error';

const EMPTY_DRAFT: CreateCommunityTopicDraft = {
  title: '',
  body: '',
  categorySlug: '',
};

export default function NewCommunityTopic() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useI18n();
  const copy = getCommunityCopy(lang);
  const [draft, setDraft] = useState<CreateCommunityTopicDraft>(EMPTY_DRAFT);
  const [categories, setCategories] = useState<CommunityCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [moduleAvailable, setModuleAvailable] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [suggestions, setSuggestions] = useState<CommunityTopicSummary[]>([]);
  const [similarState, setSimilarState] = useState<SimilarState>('idle');
  const [reviewedSimilar, setReviewedSimilar] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    let active = true;
    getCommunityCategories()
      .then((result) => {
        if (!active) return;
        setCategories(result.categories);
        setModuleAvailable(result.available);
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const query = draft.title.trim();
    if (query.length < 3) return;

    let active = true;
    const timeout = window.setTimeout(() => {
      setSimilarState('loading');
      suggestCommunityTopics(query, 5)
        .then((result) => {
          if (!active) return;
          setSuggestions(result.topics);
          setSimilarState(result.available ? 'loaded' : 'unavailable');
        })
        .catch(() => {
          if (active) setSimilarState('error');
        });
    }, 450);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [draft.title]);

  const updateTitle = (title: string) => {
    setDraft((current) => ({ ...current, title }));
    setSuggestions([]);
    setSimilarState('idle');
    setReviewedSimilar(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    const title = draft.title.trim();
    if (title.length < 1 || title.length > COMMUNITY_LIMITS.title) {
      setFormError(copy.newTopic.validationTitle);
      return;
    }
    if (draft.body.trim().length > COMMUNITY_LIMITS.body) {
      setFormError(copy.newTopic.validationBody);
      return;
    }
    if (!draft.categorySlug) {
      setFormError(copy.newTopic.validationCategory);
      return;
    }
    if (title.length >= 3 && (similarState === 'idle' || similarState === 'loading')) {
      setFormError(copy.newTopic.validationSimilarLoading);
      return;
    }
    if (suggestions.length > 0 && !reviewedSimilar) {
      setFormError(copy.newTopic.validationSimilar);
      return;
    }
    if (!agreed) {
      setFormError(copy.newTopic.validationAgreement);
      return;
    }
    if (!user) {
      window.location.assign(`/login/?next=${encodeURIComponent('/community/new/')}`);
      return;
    }

    setSubmitting(true);
    try {
      const topicId = await createCommunityTopic({ ...draft, title });
      window.location.assign(communityTopicHref(topicId));
    } catch {
      setFormError(copy.newTopic.publishFailed);
      setSubmitting(false);
    }
  };

  const loginHref = `/login/?next=${encodeURIComponent('/community/new/')}`;

  return (
    <CommunityFrame active="ask" compactHeader>
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Link href="/community/" className="text-xs font-semibold text-faint hover:text-foreground">
          {copy.actions.back}
        </Link>

        <div className="mt-5">
          {authLoading || categoriesLoading ? (
            <CommunityState kind="loading" />
          ) : loadError ? (
            <CommunityState kind="error" />
          ) : !moduleAvailable ? (
            <CommunityState kind="unavailable" />
          ) : !user ? (
            <CommunityState
              kind="empty"
              title={copy.newTopic.signInTitle}
              description={copy.newTopic.signInDescription}
              action={(
                <Link
                  href={loginHref}
                  className="gradient-button inline-flex rounded-lg px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
                >
                  {copy.actions.signIn}
                </Link>
              )}
            />
          ) : categories.length === 0 ? (
            <CommunityState
              kind="empty"
              title={copy.state.unavailableTitle}
              description={copy.newTopic.categoriesEmpty}
            />
          ) : (
            <section className="overflow-hidden rounded-xl border border-rule bg-panel">
              <header className="border-b border-rule px-5 py-6 sm:px-7">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan">
                  {copy.newTopic.eyebrow}
                </p>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
                  {copy.newTopic.title}
                </h1>
                <p className="mt-2 text-sm leading-7 text-muted">{copy.newTopic.intro}</p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-7 px-5 py-6 sm:px-7">
                <label className="block text-xs font-semibold text-muted">
                  <span className="flex items-baseline justify-between gap-3">
                    <span>{copy.newTopic.titleLabel}</span>
                    <span className="font-normal tabular-nums text-faint">
                      {draft.title.length}/{COMMUNITY_LIMITS.title}
                    </span>
                  </span>
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(event) => updateTitle(event.target.value)}
                    maxLength={COMMUNITY_LIMITS.title}
                    required
                    autoComplete="off"
                    placeholder={copy.newTopic.titlePlaceholder}
                    className="mt-2 w-full rounded-lg border border-rule bg-background px-4 py-3 text-sm font-normal text-foreground outline-none placeholder:text-faint focus:border-violet focus:ring-1 focus:ring-violet"
                  />
                  <span className="mt-2 block font-normal leading-5 text-faint">{copy.newTopic.titleHint}</span>
                </label>

                {draft.title.trim().length >= 3 && (
                  <section className="rounded-lg border border-rule bg-background p-4" aria-live="polite">
                    <h2 className="text-xs font-bold text-foreground">{copy.newTopic.similarTitle}</h2>
                    {(similarState === 'idle' || similarState === 'loading') && (
                      <p className="mt-3 text-xs text-faint">{copy.newTopic.similarLoading}</p>
                    )}
                    {(similarState === 'unavailable' || similarState === 'error') && (
                      <p className="mt-3 text-xs leading-6 text-amber-300">{copy.newTopic.similarUnavailable}</p>
                    )}
                    {similarState === 'loaded' && suggestions.length === 0 && (
                      <p className="mt-3 text-xs text-faint">{copy.index.filteredEmptyTitle}</p>
                    )}
                    {suggestions.length > 0 && (
                      <>
                        <div className="mt-3 divide-y divide-rule border-y border-rule">
                          {suggestions.map((topic) => (
                            <div key={topic.id} className="py-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <CommunityStatusBadge status={topic.status} />
                                <span className="text-[10px] text-faint">
                                  {communityCategoryName(topic, lang)}
                                </span>
                              </div>
                              <Link
                                href={communityTopicHref(topic.id)}
                                prefetch={false}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 block text-sm font-semibold leading-6 text-foreground hover:text-violet-300"
                              >
                                {topic.title}
                              </Link>
                              {topic.status === 'resolved' && (
                                <p className="mt-1 text-xs text-emerald-400">{copy.newTopic.similarResolved}</p>
                              )}
                              {topic.status === 'duplicate' && (
                                <p className="mt-1 text-xs text-amber-300">{copy.newTopic.similarDuplicate}</p>
                              )}
                            </div>
                          ))}
                        </div>
                        <label className="mt-4 flex items-start gap-3 text-xs leading-6 text-muted">
                          <input
                            type="checkbox"
                            checked={reviewedSimilar}
                            onChange={(event) => setReviewedSimilar(event.target.checked)}
                            className="mt-1 h-4 w-4 accent-violet-600"
                          />
                          <span>{copy.newTopic.reviewedSimilar}</span>
                        </label>
                      </>
                    )}
                  </section>
                )}

                <label className="block text-xs font-semibold text-muted">
                  {copy.newTopic.categoryLabel}
                  <select
                    value={draft.categorySlug}
                    onChange={(event) => setDraft((current) => ({ ...current, categorySlug: event.target.value }))}
                    required
                    className="mt-2 w-full rounded-lg border border-rule bg-background px-3 py-3 text-sm font-normal text-muted outline-none focus:border-violet focus:ring-1 focus:ring-violet"
                  >
                    <option value="" disabled>{copy.newTopic.categoryPlaceholder}</option>
                    {categories.map((category) => (
                      <option key={category.slug} value={category.slug}>
                        {communityCategoryName(category, lang)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-semibold text-muted">
                  <span className="flex items-baseline justify-between gap-3">
                    <span>{copy.newTopic.bodyLabel}</span>
                    <span className={`font-normal tabular-nums ${draft.body.length > COMMUNITY_LIMITS.body ? 'text-red-400' : 'text-faint'}`}>
                      {draft.body.length}/{COMMUNITY_LIMITS.body}
                    </span>
                  </span>
                  <textarea
                    value={draft.body}
                    onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
                    maxLength={COMMUNITY_LIMITS.body}
                    rows={9}
                    placeholder={copy.newTopic.bodyPlaceholder}
                    className="mt-2 w-full resize-y rounded-lg border border-rule bg-background px-4 py-3 text-sm font-normal leading-7 text-foreground outline-none placeholder:text-faint focus:border-violet focus:ring-1 focus:ring-violet"
                  />
                  <span className="mt-2 block font-normal leading-5 text-faint">{copy.newTopic.bodyHint}</span>
                </label>

                <div className="rounded-lg border border-violet/30 bg-violet/10 p-4">
                  <label className="flex items-start gap-3 text-xs leading-6 text-violet-100">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(event) => setAgreed(event.target.checked)}
                      className="mt-1 h-4 w-4 accent-violet-600"
                    />
                    <span>{copy.newTopic.agreement}</span>
                  </label>
                  <p className="mt-3 text-[10px] leading-5 text-violet-200/80">
                    {copy.newTopic.followHint}
                  </p>
                  <p className="mt-2 text-[10px] leading-5 text-violet-200/80">
                    {copy.newTopic.legalPrefix}{' '}
                    <Link href="/privacy/" className="font-semibold text-violet-200 hover:text-white">
                      {copy.newTopic.privacy}
                    </Link>
                    <span aria-hidden="true"> · </span>
                    <Link href="/terms/" className="font-semibold text-violet-200 hover:text-white">
                      {copy.newTopic.terms}
                    </Link>
                  </p>
                </div>

                {formError && <p className="text-sm font-medium text-red-400" role="alert">{formError}</p>}

                <div className="border-t border-rule pt-5">
                  <button
                    type="submit"
                    disabled={submitting || (draft.title.trim().length >= 3 && (similarState === 'idle' || similarState === 'loading'))}
                    className="gradient-button w-full rounded-lg px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {submitting ? copy.newTopic.publishing : copy.newTopic.publish}
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>
      </div>
    </CommunityFrame>
  );
}
