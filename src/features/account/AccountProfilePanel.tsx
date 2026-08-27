'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import AccountAvatar from '@/components/AccountAvatar';
import WasedaVerifiedBadge from '@/components/WasedaVerifiedBadge';
import { useAuth } from '@/components/AuthProvider';
import { useI18n } from '@/i18n/LanguageProvider';
import { googleAuthEnabled, startGoogleAuthentication } from '@/lib/googleAuth';
import {
  ACCOUNT_AVATAR_COLOURS,
  ACCOUNT_PROFILE_LIMITS,
  AccountProfileDraft,
  getSafeAccountNextPath,
} from './model';
import { getAccountCopy } from './copy';
import { isUsernameConflict, updateMyAccountProfile } from './repository';

export default function AccountProfilePanel() {
  const {
    user,
    loading,
    profile,
    profileLoading,
    profileAvailable,
    refreshProfile,
  } = useAuth();
  const { lang } = useI18n();
  const copy = getAccountCopy(lang);
  const [draft, setDraft] = useState<AccountProfileDraft>({
    displayName: '',
    avatarColour: 'violet',
  });
  // Registration is the one moment a nickname can be chosen.
  const displayNameLocked = Boolean(profile?.profileCompleted);
  const [nextPath, setNextPath] = useState('/');
  const [saving, setSaving] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const requested = new URLSearchParams(window.location.search).get('next');
      setNextPath(getSafeAccountNextPath(requested));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!profile) return;
    const timeout = window.setTimeout(() => {
      setDraft({
        displayName: profile.displayName,
        avatarColour: profile.avatarColour,
      });
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [profile]);

  const handleUpgrade = async () => {
    if (!googleAuthEnabled) return;
    setError('');
    setUpgrading(true);
    try {
      await startGoogleAuthentication(user, nextPath);
    } catch {
      setError(copy.profile.failed);
      setUpgrading(false);
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    const displayName = draft.displayName.normalize('NFKC').trim();

    if (
      displayName.length < ACCOUNT_PROFILE_LIMITS.displayNameMin
      || displayName.length > ACCOUNT_PROFILE_LIMITS.displayNameMax
    ) {
      setError(copy.profile.validationName);
      return;
    }

    setSaving(true);
    try {
      await updateMyAccountProfile({ ...draft, displayName });
      await refreshProfile();
      setMessage(copy.profile.saved);
    } catch (saveError) {
      setError(isUsernameConflict(saveError) ? copy.profile.usernameTaken : copy.profile.failed);
    } finally {
      setSaving(false);
    }
  };

  if (loading || (user && profileLoading && !profile)) {
    return <div className="py-14 text-center text-sm text-faint">Loading…</div>;
  }

  if (!user) {
    return (
      <section className="rounded-xl border border-rule bg-panel p-6">
        <h2 className="text-xl font-bold text-foreground">{copy.signedOut.title}</h2>
        <p className="mt-3 text-sm leading-7 text-muted">{copy.signedOut.description}</p>
        <Link
          href="/login/?next=%2Faccount%2F"
          className="gradient-button mt-6 inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          {copy.signedOut.action}
        </Link>
      </section>
    );
  }

  if (!profileAvailable) {
    return (
      <section className="rounded-xl border border-rule bg-panel p-6">
        <h2 className="text-xl font-bold text-foreground">{copy.unavailable.title}</h2>
        <p className="mt-3 text-sm leading-7 text-muted">{copy.unavailable.description}</p>
      </section>
    );
  }

  if (user.is_anonymous || !profile?.isPermanent) {
    return (
      <div className="space-y-5">
        <section className="rounded-xl border border-rule bg-panel p-6">
          <div className="flex items-start gap-4">
            <AccountAvatar displayName="Anonymous student" colour="slate" size="md" />
            <div>
              <h2 className="text-xl font-bold text-foreground">{copy.anonymous.title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted">{copy.anonymous.description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={!googleAuthEnabled || upgrading}
            className="gradient-button mt-6 rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {upgrading ? copy.anonymous.loading : copy.anonymous.action}
          </button>
          {!googleAuthEnabled && <p className="mt-3 text-xs text-amber-300">{copy.anonymous.disabled}</p>}
          {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
        </section>
        <section className="rounded-xl border border-rule bg-panel p-6">
          <h2 className="text-sm font-bold text-foreground">{copy.data.title}</h2>
          <p className="mt-2 text-xs leading-6 text-faint">{copy.data.description}</p>
          <Link href="/account/delete/" className="mt-4 inline-flex text-sm font-semibold text-red-400 hover:text-red-300">
            {copy.data.delete}
          </Link>
        </section>
      </div>
    );
  }

  if (!profile) {
    return <div className="py-14 text-center text-sm text-faint">Loading…</div>;
  }

  return (
    <div className="space-y-5">
      {!profile.profileCompleted && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {copy.profile.required}
        </div>
      )}

      <form onSubmit={handleSave} className="overflow-hidden rounded-xl border border-rule bg-panel">
        <header className="border-b border-rule px-5 py-5 sm:px-6">
          <h2 className="text-base font-bold text-foreground">{copy.profile.title}</h2>
        </header>

        <div className="grid gap-7 px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="space-y-6">
            <label className="block text-xs font-semibold text-muted">
              {copy.profile.displayName}
              <input
                value={draft.displayName}
                onChange={(event) => setDraft((current) => ({ ...current, displayName: event.target.value }))}
                maxLength={ACCOUNT_PROFILE_LIMITS.displayNameMax}
                required
                readOnly={displayNameLocked}
                aria-readonly={displayNameLocked}
                autoComplete="nickname"
                className={`mt-2 w-full rounded-lg border border-rule px-4 py-3 text-sm font-normal outline-none placeholder:text-faint ${
                  displayNameLocked
                    ? 'bg-background/60 text-muted'
                    : 'bg-background text-foreground focus:border-violet focus:ring-1 focus:ring-violet'
                }`}
              />
              <span className="mt-2 block font-normal leading-5 text-faint">
                {displayNameLocked ? copy.profile.displayNameLocked : copy.profile.displayNameHint}
              </span>
            </label>

            {/* Assigned by the database, never submitted — shown so the person
                knows the handle their posts are cited under. */}
            <div className="block text-xs font-semibold text-muted">
              {copy.profile.username}
              <div className="mt-2 flex rounded-lg border border-rule bg-background/60">
                <span className="flex items-center border-r border-rule px-3 text-sm text-faint">@</span>
                <output className="min-w-0 flex-1 px-3 py-3 font-mono text-sm font-normal text-muted">
                  {profile.username}
                </output>
              </div>
              <span className="mt-2 block font-normal leading-5 text-faint">{copy.profile.usernameHint}</span>
            </div>

            <fieldset>
              <legend className="text-xs font-semibold text-muted">{copy.profile.avatar}</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {ACCOUNT_AVATAR_COLOURS.map((colour) => (
                  <button
                    key={colour}
                    type="button"
                    onClick={() => setDraft((current) => ({ ...current, avatarColour: colour }))}
                    aria-label={colour}
                    aria-pressed={draft.avatarColour === colour}
                    className={`rounded-full p-1 ${draft.avatarColour === colour ? 'ring-2 ring-violet-300 ring-offset-2 ring-offset-panel' : ''}`}
                  >
                    <AccountAvatar displayName={draft.displayName} username={profile.username} colour={colour} size="sm" />
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[10px] leading-5 text-faint">{copy.profile.avatarHint}</p>
            </fieldset>
          </div>

          <aside className="rounded-xl border border-rule bg-background p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-faint">{copy.profile.preview}</p>
            <div className="mt-5 flex flex-col items-center text-center">
              <AccountAvatar
                displayName={draft.displayName}
                username={profile.username}
                colour={draft.avatarColour}
                size="lg"
              />
              <div className="mt-4 text-base font-bold text-foreground">
                {draft.displayName.trim() || 'Community member'}
              </div>
              <div className="mt-1 font-mono text-xs text-faint">@{profile.username}</div>
              {profile.wasedaVerified && <div className="mt-3"><WasedaVerifiedBadge /></div>}
            </div>
          </aside>
        </div>

        <footer className="flex flex-wrap items-center gap-4 border-t border-rule px-5 py-4 sm:px-6">
          <button
            type="submit"
            disabled={saving}
            className="gradient-button rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? copy.profile.saving : copy.profile.save}
          </button>
          {message && <span className="text-sm text-emerald-400" role="status">{message}</span>}
          {error && <span className="text-sm text-red-400" role="alert">{error}</span>}
          {message && nextPath !== '/account/' && nextPath !== '/' && (
            <a href={nextPath} className="text-sm font-semibold text-violet-300 hover:text-violet-200">
              {copy.profile.continue}
            </a>
          )}
        </footer>
      </form>

      <section className="rounded-xl border border-rule bg-panel p-5 sm:p-6">
        <h2 className="text-sm font-bold text-foreground">{copy.identity.title}</h2>
        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-faint">{copy.identity.email}</dt>
            <dd className="mt-1 break-all text-muted">{user.email || '—'}</dd>
            <dd className="mt-1 text-[10px] leading-5 text-faint">{copy.identity.emailPrivate}</dd>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">
              {profile.hasGoogleIdentity ? copy.identity.googleLinked : copy.identity.googleMissing}
            </span>
            {profile.wasedaVerified && <WasedaVerifiedBadge />}
          </div>
        </dl>
        {profile.wasedaVerified && <p className="mt-4 text-[10px] leading-5 text-faint">{copy.identity.badgeMeaning}</p>}
      </section>

      <section className="rounded-xl border border-rule bg-panel p-5 sm:p-6">
        <h2 className="text-sm font-bold text-foreground">{copy.data.title}</h2>
        <p className="mt-2 text-xs leading-6 text-faint">{copy.data.description}</p>
        <Link href="/account/delete/" className="mt-4 inline-flex text-sm font-semibold text-red-400 hover:text-red-300">
          {copy.data.delete}
        </Link>
      </section>
    </div>
  );
}
