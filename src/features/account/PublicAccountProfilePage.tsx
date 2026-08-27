'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AccountAvatar from '@/components/AccountAvatar';
import WasedaVerifiedBadge from '@/components/WasedaVerifiedBadge';
import { useI18n } from '@/i18n/LanguageProvider';
import { PublicAccountProfile, isValidAccountUsername, normaliseAccountUsername } from './model';
import { getAccountCopy } from './copy';
import { getPublicAccountProfile } from './repository';

type ProfileState = 'loading' | 'invalid' | 'missing' | 'unavailable' | 'loaded' | 'error';

export default function PublicAccountProfilePage() {
  const { lang } = useI18n();
  const copy = getAccountCopy(lang).publicProfile;
  const [state, setState] = useState<ProfileState>('loading');
  const [profile, setProfile] = useState<PublicAccountProfile | null>(null);

  useEffect(() => {
    const username = normaliseAccountUsername(
      new URLSearchParams(window.location.search).get('username') ?? '',
    );
    if (!isValidAccountUsername(username)) {
      const timeout = window.setTimeout(() => setState('invalid'), 0);
      return () => window.clearTimeout(timeout);
    }

    let active = true;
    getPublicAccountProfile(username)
      .then((snapshot) => {
        if (!active) return;
        setProfile(snapshot.profile);
        setState(!snapshot.available ? 'unavailable' : snapshot.profile ? 'loaded' : 'missing');
      })
      .catch(() => {
        if (active) setState('error');
      });

    return () => {
      active = false;
    };
  }, []);

  const joinedDate = profile?.joinedAt
    ? new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-GB', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(profile.joinedAt))
    : '';

  const emptyCopy = state === 'invalid'
    ? [copy.invalidTitle, copy.invalidDescription]
    : state === 'error'
      ? [copy.errorTitle, copy.errorDescription]
    : state === 'unavailable'
      ? [copy.unavailableTitle, copy.unavailableDescription]
      : [copy.missingTitle, copy.missingDescription];

  return (
    <div className="min-h-[72vh] bg-background">
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Link href="/community/" className="text-xs font-semibold text-faint hover:text-foreground">
          {copy.back}
        </Link>

        {state === 'loading' ? (
          <p className="py-16 text-center text-sm text-faint">{copy.loading}</p>
        ) : state !== 'loaded' || !profile ? (
          <section className="mt-6 rounded-xl border border-rule bg-panel p-7 text-center">
            <h1 className="text-xl font-bold text-foreground">{emptyCopy[0]}</h1>
            <p className="mt-3 text-sm leading-7 text-muted">{emptyCopy[1]}</p>
          </section>
        ) : (
          <section className="mt-6 overflow-hidden rounded-xl border border-rule bg-panel">
            <div className="border-b border-rule px-6 py-8 sm:px-8">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan">{copy.eyebrow}</p>
              <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
                <AccountAvatar
                  displayName={profile.displayName}
                  username={profile.username}
                  colour={profile.avatarColour}
                  size="lg"
                />
                <div>
                  <h1 className="text-2xl font-extrabold text-foreground">{profile.displayName}</h1>
                  <p className="mt-1 font-mono text-sm text-faint">@{profile.username}</p>
                  {profile.badges.includes('waseda-verified') && (
                    <div className="mt-3"><WasedaVerifiedBadge /></div>
                  )}
                  {joinedDate && (
                    <p className="mt-3 text-xs text-faint">{copy.joined.replace('{date}', joinedDate)}</p>
                  )}
                </div>
              </div>
            </div>
            <dl className="grid grid-cols-2 divide-x divide-rule">
              <div className="px-6 py-6 text-center">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-faint">{copy.topics}</dt>
                <dd className="mt-2 text-2xl font-bold tabular-nums text-foreground">{profile.topicCount}</dd>
              </div>
              <div className="px-6 py-6 text-center">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-faint">{copy.replies}</dt>
                <dd className="mt-2 text-2xl font-bold tabular-nums text-foreground">{profile.replyCount}</dd>
              </div>
            </dl>
          </section>
        )}
      </main>
    </div>
  );
}
