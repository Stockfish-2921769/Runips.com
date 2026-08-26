'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import ProfessorDirectoryRow from '@/components/ProfessorDirectoryRow';
import { Professor, DIVISIONS } from '@/types';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/i18n/LanguageProvider';
import { ProfessorReviewSummary, REVIEW_DIMENSION_KEYS } from '@/features/professor-reviews/model';
import { getAllProfessorReviewSummaries } from '@/features/professor-reviews/repository';
import { PROFESSOR_EN } from '@/data/professorNames';

type DivisionFilter = '全部' | (typeof DIVISIONS)[number];

export default function Home() {
  const { lang, t, dimensions } = useI18n();
  const [activeTab, setActiveTab] = useState<DivisionFilter>('全部');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Professor[]>([]);
  const [reviewSummaries, setReviewSummaries] = useState<Record<number, ProfessorReviewSummary>>({});
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const fetchData = useCallback(() => {
    Promise.all([
      supabase.from('professors').select('*').order('id', { ascending: true }),
      getAllProfessorReviewSummaries().catch(() => ({})),
    ]).then(([profRes, rateRes]) => {
      if (!profRes.error && profRes.data) {
        setItems(profRes.data as Professor[]);
        setUpdatedAt(new Date());
      }
      setReviewSummaries(rateRes);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs: DivisionFilter[] = ['全部', ...DIVISIONS];
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = items.filter((item) => {
    if (activeTab !== '全部' && item.division !== activeTab) return false;
    if (!normalizedQuery) return true;
    const translated = PROFESSOR_EN[item.id];
    return [item.name, item.lab, translated?.nameEn, translated?.nameJa, translated?.labEn, ...(translated?.aliases ?? [])]
      .filter((value): value is string => !!value)
      .some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
  });

  const previewItem = filtered[0] ?? items[0];
  const previewTranslation = previewItem ? PROFESSOR_EN[previewItem.id] : undefined;
  const previewName = previewItem
    ? lang === 'en' && previewTranslation
      ? previewTranslation.nameEn
      : previewItem.name
    : '';
  const previewLab = previewItem
    ? lang === 'en' && previewTranslation?.labEn
      ? previewTranslation.labEn
      : previewItem.lab || t('common.labUnknown')
    : '';
  const previewSummary = previewItem ? reviewSummaries[previewItem.id] : undefined;
  const previewChooseAgain = previewSummary?.wouldChooseAgainPercent;
  const updatedLabel = updatedAt?.toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    document.getElementById('supervisor-directory')?.scrollIntoView();
  };

  return (
    <div>
      <section className="hero-grid relative overflow-hidden border-b border-rule/60">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-rule bg-panel/80 px-3 py-1.5 text-[10px] font-medium text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
              {t('hero.badge')}
            </div>
            <h1 className="mt-7 text-4xl font-extrabold leading-[1.05] tracking-[-0.035em] text-foreground sm:text-6xl lg:text-7xl">
              {t('hero.title')}<br />
              <span className="gradient-text">{t('hero.highlight')}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-muted sm:text-base">
              {t('hero.desc')}
            </p>

            <form onSubmit={handleSearch} className="mx-auto mt-8 flex max-w-3xl flex-col gap-3 sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">{t('home.searchPlaceholder')}</span>
                <svg aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                </svg>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('home.searchPlaceholder')}
                  className="h-14 w-full rounded-xl border border-rule bg-background px-4 pl-11 text-sm text-foreground outline-none placeholder:text-faint focus:border-violet focus:ring-1 focus:ring-violet"
                />
              </label>
              <button type="submit" className="gradient-button h-14 rounded-xl px-7 text-sm font-semibold text-white hover:opacity-90 sm:min-w-40">
                {t('hero.searchAction')}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-center text-xs">
              <button type="button" onClick={() => document.getElementById('supervisor-directory')?.scrollIntoView()} className="text-muted hover:text-foreground">
                {t('hero.explore')}
              </button>
            </div>
          </div>

          <div className="mx-auto mt-14 max-w-4xl rounded-2xl border border-rule bg-panel p-2 sm:mt-16">
            <div className="flex items-center justify-between border-b border-rule px-3 py-2 text-[9px] text-faint">
              <div className="flex gap-1.5" aria-hidden="true">
                <span className="h-2 w-2 rounded-full bg-red-500/70" />
                <span className="h-2 w-2 rounded-full bg-amber-400/70" />
                <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
              </div>
              <span>{t('hero.preview')}</span>
              <span>{updatedLabel || t('common.loading')}</span>
            </div>

            {loading || !previewItem ? (
              <div className="py-24 text-center text-xs text-faint">{t('common.loading')}</div>
            ) : (
              <div className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 border-b border-rule pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="gradient-button flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white">
                      {previewName[0]}
                    </div>
                    <div className="min-w-0 text-left">
                      <Link href={`/professors/${previewItem.id}`} className="block truncate text-sm font-semibold text-foreground hover:text-cyan">
                        {previewName}
                      </Link>
                      <p className="mt-1 truncate text-xs text-faint">{previewLab}</p>
                    </div>
                  </div>
                  <span className="self-start rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[10px] font-medium text-emerald-400 sm:self-auto">
                    {t(`division.${previewItem.division}` as never) || previewItem.division}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-rule bg-rule sm:grid-cols-5">
                  {[
                    [t('review.overall'), previewSummary?.overallAverage?.toFixed(1) ?? '—'],
                    [t('review.studentReviews'), previewSummary?.reviewCount ?? 0],
                    [t('review.wouldChooseAgainShort'), previewChooseAgain === null || previewChooseAgain === undefined ? '—' : `${previewChooseAgain}%`],
                    [t('review.pressure'), previewSummary?.pressureAverage?.toFixed(1) ?? '—'],
                    [t('stats.citations'), previewItem.scholar_citations ?? t('common.tbd')],
                  ].map(([label, value], index) => (
                    <div key={String(label)} className={`bg-panel-raised px-3 py-4 text-center ${index === 4 ? 'col-span-2 sm:col-span-1' : ''}`}>
                      <div className="text-lg font-bold tabular-nums text-foreground">{value}</div>
                      <div className="mt-1 text-[9px] uppercase tracking-wide text-faint">{label}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-rule bg-background/50 p-4 text-left">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-faint">{t('review.researchMentorship')}</p>
                    <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3">
                      {dimensions.slice(0, 4).map((dimension, index) => (
                        <div key={dimension.label} className="flex items-center justify-between gap-3 text-[11px]">
                          <span className="truncate text-muted">{dimension.label}</span>
                          <span className="font-semibold tabular-nums text-cyan">
                            {previewSummary?.dimensionAverages[REVIEW_DIMENSION_KEYS[index]]?.toFixed(1) ?? '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-rule bg-background/50 p-4 text-left">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-faint">{t('review.community')}</p>
                    <p className="mt-4 text-sm font-semibold text-foreground">
                      {previewSummary?.reviewCount ? t('review.basedOn', { n: previewSummary.reviewCount }) : t('review.noReviews')}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-faint">{t('home.desc')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-24">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t('hero.whyTitle')}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted">{t('hero.whyDesc')}</p>
        <div className="mt-10 grid gap-3 text-left sm:grid-cols-3">
          {[dimensions[0], dimensions[2], dimensions[3]].map((dimension, index) => (
            <div key={dimension.label} className="rounded-xl border border-rule bg-panel p-5">
              <span className={`block h-1.5 w-1.5 rounded-full ${index === 0 ? 'bg-fuchsia-500' : index === 1 ? 'bg-violet-500' : 'bg-cyan'}`} />
              <h3 className="mt-4 text-sm font-semibold text-foreground">{dimension.label}</h3>
              <p className="mt-2 text-xs leading-5 text-faint">{dimension.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="supervisor-directory" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-24 sm:px-6" aria-labelledby="professor-directory-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-faint">{t('home.kicker')}</p>
            <h2 id="professor-directory-title" className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t('home.title')}</h2>
            <p className="mt-2 text-xs text-faint">{t('home.desc')}</p>
          </div>
          <span className="text-[10px] text-faint">{t('home.updated')} {updatedLabel || '—'} · {filtered.length}/{items.length}</span>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2" role="group" aria-label={t('home.title')}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              aria-pressed={activeTab === tab}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-medium ${
                activeTab === tab
                  ? 'border-violet bg-violet/15 text-violet-300'
                  : 'border-rule bg-panel text-faint hover:text-foreground'
              }`}
            >
              {tab === '全部' ? t('tabs.all') : t(`division.${tab}` as never) || tab}
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-rule bg-panel">
          <div className="hidden grid-cols-[52px_minmax(0,1fr)_100px_100px_100px_64px] border-b border-rule bg-panel-raised px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-faint md:grid">
            <span>#</span>
            <span>{t('home.title')}</span>
            <span className="text-center">{t('review.overall')}</span>
            <span className="text-center">{t('stats.citations')}</span>
            <span className="text-center">{t('review.wouldChooseAgainShort')}</span>
            <span />
          </div>
          {loading ? (
            <div className="py-16 text-center text-xs text-faint">{t('common.loading')}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted">{normalizedQuery ? t('home.noSearchResults') : t('common.empty')}</div>
          ) : (
            filtered.map((item) => (
              <ProfessorDirectoryRow key={item.id} item={item} reviewSummary={reviewSummaries[item.id]} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
