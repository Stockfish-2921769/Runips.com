'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/i18n/LanguageProvider';
import { getCommunityCopy, interpolateCommunityCopy } from './copy';
import CommunityFrame from './CommunityFrame';
import CommunityState from './CommunityState';
import CommunityStatusBadge from './CommunityStatusBadge';
import {
  CommunityFilter,
  CommunityIndexSnapshot,
  CommunityTopicSummary,
  communityTopicHref,
} from './model';
import {
  communityCategoryName,
  formatCommunityDate,
  normaliseCommunitySearch,
} from './presentation';
import { getCommunityIndex, suggestCommunityTopics } from './repository';

type SearchState = 'idle' | 'loading' | 'loaded' | 'unavailable' | 'error';

const EMPTY_SNAPSHOT: CommunityIndexSnapshot = {
  topics: [],
  categories: [],
  available: true,
};

function topicMatchesFilter(topic: CommunityTopicSummary, filter: CommunityFilter): boolean {
  if (filter === 'resolved') return topic.status === 'resolved';
  if (filter === 'open') return topic.status === 'open';
  return true;
}

export default function CommunityIndex() {
  const { lang } = useI18n();
  const copy = getCommunityCopy(lang);
  const [snapshot, setSnapshot] = useState<CommunityIndexSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState('');
  const [remoteTopics, setRemoteTopics] = useState<CommunityTopicSummary[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [filter, setFilter] = useState<CommunityFilter>('latest');
  const [categorySlug, setCategorySlug] = useState('all');

  useEffect(() => {
    let active = true;

    getCommunityIndex()
      .then((nextSnapshot) => {
        if (active) setSnapshot(nextSnapshot);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    const searchQuery = query.trim();
    if (!searchQuery) return;

    let active = true;
    const timeout = window.setTimeout(() => {
      setSearchState('loading');
      suggestCommunityTopics(searchQuery, 50)
        .then((result) => {
          if (!active) return;
          setRemoteTopics(result.topics);
          setSearchState(result.available ? 'loaded' : 'unavailable');
        })
        .catch(() => {
          if (active) setSearchState('error');
        });
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [query]);

  const updateQuery = (value: string) => {
    setQuery(value);
    setRemoteTopics([]);
    setSearchState('idle');
  };

  const visibleTopics = useMemo(() => {
    const normalisedQuery = normaliseCommunitySearch(query);
    const remoteTopicIds = new Set(remoteTopics.map((topic) => topic.id));
    const topics = [...snapshot.topics];
    for (const topic of remoteTopics) {
      if (!snapshot.topics.some((candidate) => candidate.id === topic.id)) topics.push(topic);
    }

    return topics.filter((topic) => {
      if (!topicMatchesFilter(topic, filter)) return false;
      if (categorySlug !== 'all' && topic.categorySlug !== categorySlug) return false;
      if (!normalisedQuery) return true;

      return remoteTopicIds.has(topic.id) || normaliseCommunitySearch([
        topic.title,
        topic.bodyExcerpt,
        topic.categoryNameEn,
        topic.categoryNameZh,
      ].join(' ')).includes(normalisedQuery);
    });
  }, [categorySlug, filter, query, remoteTopics, snapshot.topics]);

  const hasFilters = query.trim().length > 0 || filter !== 'latest' || categorySlug !== 'all';

  return (
    <CommunityFrame active="browse">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-xl">
            <label htmlFor="community-search" className="text-xs font-semibold text-muted">
              {copy.index.searchLabel}
            </label>
            <input
              id="community-search"
              type="search"
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder={copy.index.searchPlaceholder}
              className="mt-2 w-full rounded-lg border border-rule bg-panel px-4 py-3 text-sm text-foreground outline-none placeholder:text-faint focus:border-violet focus:ring-1 focus:ring-violet"
            />
          </div>
          <Link
            href="/community/new/"
            className="gradient-button inline-flex shrink-0 items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            {copy.actions.createTopic}
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-b border-rule pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1" role="group" aria-label={copy.index.searchLabel}>
            {(['latest', 'open', 'resolved'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={`rounded-md px-3 py-2 text-xs font-semibold ${
                  filter === value
                    ? 'bg-rule text-foreground'
                    : 'text-faint hover:bg-panel hover:text-foreground'
                }`}
              >
                {copy.index.filters[value]}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-muted">
            <span>{copy.index.categoryLabel}</span>
            <select
              value={categorySlug}
              onChange={(event) => setCategorySlug(event.target.value)}
              className="rounded-lg border border-rule bg-panel px-3 py-2 text-xs font-normal text-muted outline-none focus:border-violet focus:ring-1 focus:ring-violet"
            >
              <option value="all">{copy.index.allCategories}</option>
              {snapshot.categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {communityCategoryName(category, lang)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {query.trim() && (searchState === 'idle' || searchState === 'loading') && (
          <p className="mt-4 text-xs text-faint" role="status">{copy.index.searching}</p>
        )}
        {query.trim() && (searchState === 'unavailable' || searchState === 'error') && (
          <p className="mt-4 text-xs leading-6 text-amber-300">{copy.index.searchUnavailable}</p>
        )}

        <div className="mt-5">
          {loading ? (
            <CommunityState kind="loading" />
          ) : error ? (
            <CommunityState
              kind="error"
              action={(
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setError(false);
                    setReloadKey((value) => value + 1);
                  }}
                  className="rounded-lg border border-rule px-4 py-2 text-sm font-semibold text-muted hover:bg-rule hover:text-foreground"
                >
                  {copy.actions.retry}
                </button>
              )}
            />
          ) : !snapshot.available ? (
            <CommunityState kind="unavailable" />
          ) : visibleTopics.length === 0 ? (
            <CommunityState
              kind="empty"
              title={hasFilters ? copy.index.filteredEmptyTitle : copy.index.emptyTitle}
              description={hasFilters ? copy.index.filteredEmptyDescription : copy.index.emptyDescription}
              action={!hasFilters ? (
                <Link
                  href="/community/new/"
                  className="inline-flex rounded-lg border border-violet/40 px-4 py-2 text-sm font-semibold text-violet-300 hover:bg-violet/10"
                >
                  {copy.actions.createTopic}
                </Link>
              ) : undefined}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-rule bg-panel">
              {visibleTopics.map((topic, index) => {
                const replyLabel = topic.replyCount === 1 ? copy.index.reply : copy.index.replies;
                const configuredCategory = snapshot.categories.find((category) => category.slug === topic.categorySlug);
                const categoryName = communityCategoryName(configuredCategory ?? topic, lang);
                const lastActive = interpolateCommunityCopy(copy.index.lastActive, {
                  date: formatCommunityDate(topic.lastActivityAt, lang),
                });

                return (
                  <article
                    key={topic.id}
                    className={`grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-4 py-4 sm:px-5 ${
                      index > 0 ? 'border-t border-rule' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <CommunityStatusBadge status={topic.status} />
                        <span className="text-[10px] text-faint">{categoryName}</span>
                      </div>
                      <h2 className="mt-2 text-sm font-bold leading-6 text-foreground sm:text-base">
                        <Link
                          href={communityTopicHref(topic.id)}
                          prefetch={false}
                          className="hover:text-violet-300"
                        >
                          {topic.title}
                        </Link>
                      </h2>
                      {topic.bodyExcerpt && (
                        <p className="mt-1 line-clamp-1 text-xs leading-6 text-faint">{topic.bodyExcerpt}</p>
                      )}
                      <p className="mt-2 text-[10px] text-faint">{lastActive}</p>
                    </div>
                    <div className="min-w-14 self-center text-right">
                      <div className="text-lg font-bold tabular-nums text-muted">{topic.replyCount}</div>
                      <div className="mt-0.5 text-[9px] text-faint">{replyLabel}</div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </CommunityFrame>
  );
}
