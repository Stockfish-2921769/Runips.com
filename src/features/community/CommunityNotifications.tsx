'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useI18n } from '@/i18n/LanguageProvider';
import { getCommunityCopy } from './copy';
import CommunityFrame from './CommunityFrame';
import CommunityState from './CommunityState';
import {
  CommunityNotificationSnapshot,
  communityTopicHref,
} from './model';
import { formatCommunityDate } from './presentation';
import {
  getCommunityNotifications,
  markCommunityNotificationRead,
} from './repository';

const EMPTY_SNAPSHOT: CommunityNotificationSnapshot = {
  notifications: [],
  available: true,
};

export default function CommunityNotifications() {
  const { user, loading: authLoading, profile, profileLoading } = useAuth();
  const { lang } = useI18n();
  const copy = getCommunityCopy(lang);
  const [snapshot, setSnapshot] = useState<CommunityNotificationSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (authLoading || !user || !profile?.isPermanent) return;
    let active = true;

    getCommunityNotifications()
      .then((nextSnapshot) => {
        if (active) {
          setSnapshot(nextSnapshot);
          setError(false);
        }
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
  }, [authLoading, profile?.isPermanent, reloadKey, user]);

  const handleMarkRead = async (notificationId: number) => {
    setBusyId(notificationId);
    setNotice('');
    try {
      await markCommunityNotificationRead(notificationId);
      setSnapshot((current) => ({
        ...current,
        notifications: current.notifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, readAt: new Date().toISOString() }
            : notification),
      }));
    } catch {
      setNotice(copy.notifications.markFailed);
    } finally {
      setBusyId(null);
    }
  };

  const loginHref = `/login/?next=${encodeURIComponent('/community/notifications/')}`;
  const accountHref = `/account/?next=${encodeURIComponent('/community/notifications/')}`;

  return (
    <CommunityFrame active="notifications" compactHeader>
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <Link href="/community/" className="text-xs font-semibold text-faint hover:text-foreground">
          {copy.actions.back}
        </Link>

        <header className="mt-5 border-b border-rule pb-6">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan">
            {copy.notifications.eyebrow}
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {copy.notifications.title}
          </h1>
          <p className="mt-2 text-sm leading-7 text-muted">{copy.notifications.intro}</p>
        </header>

        <div className="mt-6">
          {authLoading || (user && profileLoading) ? (
            <CommunityState kind="loading" />
          ) : !user ? (
            <CommunityState
              kind="empty"
              title={copy.notifications.signInTitle}
              description={copy.notifications.signInDescription}
              action={(
                <Link
                  href={loginHref}
                  className="gradient-button inline-flex rounded-lg px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
                >
                  {copy.actions.signIn}
                </Link>
              )}
            />
          ) : !profile?.isPermanent ? (
            <CommunityState
              kind="empty"
              title={copy.newTopic.completeProfileTitle}
              description={copy.newTopic.completeProfileDescription}
              action={(
                <Link
                  href={accountHref}
                  className="gradient-button inline-flex rounded-lg px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
                >
                  {copy.newTopic.completeProfileAction}
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
          ) : snapshot.notifications.length === 0 ? (
            <CommunityState
              kind="empty"
              title={copy.notifications.emptyTitle}
              description={copy.notifications.emptyDescription}
            />
          ) : (
            <>
              {notice && <p className="mb-4 text-sm font-medium text-red-400" role="alert">{notice}</p>}
              <div className="overflow-hidden rounded-xl border border-rule bg-panel">
                {snapshot.notifications.map((notification, index) => {
                  const unread = notification.readAt === null;
                  return (
                    <article
                      key={notification.id}
                      className={`grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5 ${
                        index > 0 ? 'border-t border-rule' : ''
                      } ${unread ? 'bg-violet/[0.04]' : ''}`}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                            unread
                              ? 'border-violet/30 bg-violet/10 text-violet-300'
                              : 'border-rule bg-background text-faint'
                          }`}>
                            {unread ? copy.notifications.unread : copy.notifications.read}
                          </span>
                          <span className="text-[10px] font-semibold text-muted">
                            {copy.notifications.kinds[notification.kind]}
                          </span>
                          <span className="text-[10px] text-faint">
                            {formatCommunityDate(notification.createdAt, lang)}
                          </span>
                        </div>
                        <h2 className="mt-2 text-sm font-bold leading-6 text-foreground">
                          <Link
                            href={communityTopicHref(notification.topicId)}
                            prefetch={false}
                            className="hover:text-violet-300"
                          >
                            {notification.topicTitle}
                          </Link>
                        </h2>
                        {notification.excerpt && (
                          <p className="mt-1 line-clamp-1 text-xs leading-6 text-faint">{notification.excerpt}</p>
                        )}
                      </div>
                      {unread && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(notification.id)}
                          disabled={busyId !== null}
                          className="justify-self-start rounded-md border border-rule px-3 py-2 text-[10px] font-semibold text-muted hover:bg-rule hover:text-foreground disabled:opacity-50 sm:justify-self-end"
                        >
                          {busyId === notification.id
                            ? copy.notifications.markingRead
                            : copy.notifications.markRead}
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </CommunityFrame>
  );
}
