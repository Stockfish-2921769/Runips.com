'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useI18n } from '@/i18n/LanguageProvider';
import { getCommunityCopy, interpolateCommunityCopy } from './copy';
import CommunityFrame from './CommunityFrame';
import CommunityState from './CommunityState';
import {
  CommunityReportResolutionAction,
  CommunityReportSnapshot,
  communityTopicHref,
} from './model';
import { formatCommunityDate } from './presentation';
import { getCommunityReports, resolveCommunityReport } from './repository';

const EMPTY_SNAPSHOT: CommunityReportSnapshot = {
  reports: [],
  available: true,
  authorised: false,
};

export default function CommunityModeration() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useI18n();
  const copy = getCommunityCopy(lang);
  const [snapshot, setSnapshot] = useState<CommunityReportSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (authLoading || !user) return;
    let active = true;

    getCommunityReports()
      .then((nextSnapshot) => {
        if (!active) return;
        setSnapshot(nextSnapshot);
        setError(false);
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
  }, [authLoading, reloadKey, user]);

  const handleResolution = async (
    reportId: number,
    action: CommunityReportResolutionAction,
  ) => {
    const confirmation = action === 'hide'
      ? copy.moderation.hideConfirm
      : copy.moderation.dismissConfirm;
    if (!window.confirm(confirmation)) return;

    setBusyId(reportId);
    setNotice('');
    try {
      await resolveCommunityReport(reportId, action);
      setSnapshot((current) => ({
        ...current,
        reports: current.reports.filter((report) => report.id !== reportId),
      }));
    } catch {
      setNotice(copy.moderation.actionFailed);
    } finally {
      setBusyId(null);
    }
  };

  const loginHref = `/login/?next=${encodeURIComponent('/community/moderation/')}`;

  return (
    <CommunityFrame compactHeader>
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Link href="/community/" className="text-xs font-semibold text-faint hover:text-foreground">
          {copy.actions.back}
        </Link>

        <header className="mt-5 border-b border-rule pb-6">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-300">
            {copy.moderation.eyebrow}
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {copy.moderation.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{copy.moderation.intro}</p>
        </header>

        <div className="mt-6">
          {authLoading ? (
            <CommunityState kind="loading" />
          ) : !user ? (
            <CommunityState
              kind="empty"
              title={copy.moderation.signInTitle}
              description={copy.moderation.signInDescription}
              action={(
                <Link
                  href={loginHref}
                  className="gradient-button inline-flex rounded-lg px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
                >
                  {copy.actions.signIn}
                </Link>
              )}
            />
          ) : loading ? (
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
          ) : !snapshot.authorised ? (
            <CommunityState
              kind="empty"
              title={copy.moderation.deniedTitle}
              description={copy.moderation.deniedDescription}
            />
          ) : snapshot.reports.length === 0 ? (
            <CommunityState
              kind="empty"
              title={copy.moderation.emptyTitle}
              description={copy.moderation.emptyDescription}
            />
          ) : (
            <>
              {notice && <p className="mb-4 text-sm font-medium text-red-400" role="alert">{notice}</p>}
              <div className="space-y-4">
                {snapshot.reports.map((report) => (
                  <article key={report.id} className="overflow-hidden rounded-xl border border-rule bg-panel">
                    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-rule px-5 py-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-amber-300">
                            {copy.moderation[report.targetType]}
                          </span>
                          <span className="text-[10px] text-faint">
                            {interpolateCommunityCopy(copy.moderation.reported, {
                              date: formatCommunityDate(report.createdAt, lang),
                            })}
                          </span>
                        </div>
                        <h2 className="mt-2 text-sm font-bold leading-6 text-foreground">
                          <Link
                            href={communityTopicHref(report.topicId)}
                            prefetch={false}
                            className="hover:text-violet-300"
                          >
                            {report.contentTitle || `#${report.topicId}`}
                          </Link>
                        </h2>
                      </div>
                      <span className="font-mono text-[9px] text-faint">REPORT #{report.id}</span>
                    </header>

                    <div className="grid gap-px bg-rule md:grid-cols-2">
                      <section className="bg-panel px-5 py-4">
                        <h3 className="text-[9px] font-bold uppercase tracking-wide text-faint">
                          {copy.moderation.reason}
                        </h3>
                        <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-muted">
                          {report.reason}
                        </p>
                      </section>
                      <section className="bg-panel px-5 py-4">
                        <h3 className="text-[9px] font-bold uppercase tracking-wide text-faint">
                          {copy.moderation.content}
                        </h3>
                        <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-muted">
                          {report.contentExcerpt || '—'}
                        </p>
                      </section>
                    </div>

                    <footer className="flex flex-wrap justify-end gap-2 border-t border-rule px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleResolution(report.id, 'dismiss')}
                        disabled={busyId !== null}
                        className="rounded-lg border border-rule px-4 py-2 text-xs font-semibold text-muted hover:bg-rule hover:text-foreground disabled:opacity-50"
                      >
                        {busyId === report.id ? copy.moderation.working : copy.moderation.dismiss}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolution(report.id, 'hide')}
                        disabled={busyId !== null}
                        className="rounded-lg border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        {busyId === report.id ? copy.moderation.working : copy.moderation.hide}
                      </button>
                    </footer>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </CommunityFrame>
  );
}
