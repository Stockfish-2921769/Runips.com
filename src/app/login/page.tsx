'use client';

import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/i18n/LanguageProvider';

export default function LoginPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState<'anonymous' | 'google' | null>(null);
  const [error, setError] = useState('');
  const googleAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true';

  const getSafeNextPath = () => {
    const requestedPath = new URLSearchParams(window.location.search).get('next');
    return requestedPath?.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/';
  };

  const handleAnonymousLogin = async () => {
    setLoading('anonymous');
    setError('');
    const { error: signInError } = await supabase.auth.signInAnonymously();
    if (signInError) {
      setError(signInError.message);
      setLoading(null);
      return;
    }
    window.location.assign(getSafeNextPath());
  };

  const handleGoogleLogin = async () => {
    setLoading('google');
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: new URL(getSafeNextPath(), window.location.origin).toString(),
      },
    });
    if (error) {
      setError(error.message);
      setLoading(null);
    }
  };

  return (
    <div className="hero-grid flex min-h-[72vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-rule bg-panel p-6 sm:p-8">
        <div className="text-center">
          <span className="gradient-button mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white">R</span>
          <p className="mt-5 text-[9px] font-bold uppercase tracking-[0.18em] text-cyan">RUNIPS / ACCOUNT</p>
          <h1 className="mt-3 text-2xl font-bold text-foreground">{t('login.welcome')}</h1>
          <p className="mt-2 text-xs leading-6 text-faint">{t('login.subtitle')}</p>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
        )}

        <button
          type="button"
          onClick={handleAnonymousLogin}
          disabled={loading !== null}
          className="gradient-button mt-7 w-full rounded-lg py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading === 'anonymous' ? t('login.anonymousLoading') : t('login.anonymous')}
        </button>

        <p className="mt-3 text-center text-[10px] leading-5 text-faint">{t('login.anonymousNote')}</p>

        {googleAuthEnabled && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs text-faint">
              <span className="h-px flex-1 bg-rule" />
              <span>{t('login.or')}</span>
              <span className="h-px flex-1 bg-rule" />
            </div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading !== null}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-rule bg-background py-2.5 text-sm font-medium text-muted hover:text-foreground disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {loading === 'google' ? t('login.redirecting') : t('login.google')}
            </button>
          </>
        )}

        <p className="mt-6 whitespace-pre-line text-center text-[10px] leading-5 text-faint">{t('login.privacy')}</p>
        <p className="mt-3 text-center text-[10px] leading-5 text-faint">
          {t('login.agreement')}{' '}
          <Link href="/terms" className="font-semibold text-violet-300 hover:text-violet-200">{t('legal.terms')}</Link>
          <span aria-hidden="true"> · </span>
          <Link href="/privacy" className="font-semibold text-violet-300 hover:text-violet-200">{t('legal.privacy')}</Link>
        </p>
      </div>
    </div>
  );
}
