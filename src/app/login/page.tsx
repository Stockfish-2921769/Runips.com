'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getSafeAccountNextPath } from '@/features/account/model';
import { useI18n } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/translations';
import { googleAuthEnabled, startGoogleAuthentication } from '@/lib/googleAuth';
import { supabase } from '@/lib/supabase';

// Structural copy (a table plus a note list) rather than the flat strings
// `t()` resolves, so it lives here in the same shape the markup needs — the
// same approach `features/community/copy.ts` takes.
interface AccountDesignRow {
  role: string;
  browse: string;
  post: string;
  review: string;
  /** Draws attention to the verified-email row without changing its meaning. */
  highlight?: boolean;
}

interface AccountDesignCopy {
  title: string;
  intro: string;
  columns: string[];
  rows: AccountDesignRow[];
  notes: string[];
  privacy: {
    /** Kept word-for-word in step with the Privacy Notice. */
    gdpr: string;
    linkIntro: string;
    linkBetween: string;
    linkEnd: string;
    /** Chinese wraps document titles in 《》; English leaves them bare. */
    quoteOpen: string;
    quoteClose: string;
  };
}

const ACCOUNT_DESIGN: Record<Lang, AccountDesignCopy> = {
  zh: {
    title: '账号是怎么设计的',
    intro: '不同身份能做的事不一样。评价永远匿名，登录只影响你能否在交流中心发言。',
    columns: ['身份', '浏览', '发帖 / 回复', '教授评价'],
    rows: [
      { role: '未登录', browse: '可以', post: '不可以', review: '不可以' },
      { role: '匿名账户', browse: '可以', post: '不可以', review: '可以，匿名' },
      { role: 'Google 账户', browse: '可以', post: '可以', review: '可以，匿名' },
      {
        role: 'Waseda 邮箱\nGoogle 账户',
        browse: '可以',
        post: '可以，带验证标识',
        review: '仍完全匿名\n不显示标识',
        highlight: true,
      },
    ],
    notes: [
      '邮箱、Google 姓名和头像永不公开。交流中心仍然显示「Community member」，旁边只多一个验证标识。',
      '教授评价页面不显示任何校内标识，避免缩小匿名评价者的范围。',
      '已有匿名账户点 Google 会原地升级，保留原来的账号 ID、评价、帖子和投票，不会变成一个新账号。',
    ],
    privacy: {
      gdpr: '本站点以 GDPR 的核心要求作为所有用户的数据保护基线，并在 GDPR 对某位用户或某项处理具有法律效力时履行其强制要求。',
      linkIntro: '关于隐私保护的更多内容，请参照',
      linkBetween: '和',
      linkEnd: '。',
      quoteOpen: '《',
      quoteClose: '》',
    },
  },
  en: {
    title: 'How accounts work here',
    intro:
      'What you can do depends on how you sign in. Reviews stay anonymous either way — signing in only affects whether you can post in Community.',
    columns: ['Account', 'Browse', 'Post / reply', 'Supervisor reviews'],
    rows: [
      { role: 'Signed out', browse: 'Yes', post: 'No', review: 'No' },
      { role: 'Anonymous', browse: 'Yes', post: 'No', review: 'Yes, anonymous' },
      { role: 'Google', browse: 'Yes', post: 'Yes', review: 'Yes, anonymous' },
      {
        role: 'Google with\nWaseda email',
        browse: 'Yes',
        post: 'Yes, with a\nverified mark',
        review: 'Still fully anonymous\nno mark shown',
        highlight: true,
      },
    ],
    notes: [
      'Your email, Google name and photo are never published. Community still shows “Community member”, with the verified mark beside it.',
      'Supervisor review pages show no campus mark at all, so the pool of possible anonymous reviewers is never narrowed.',
      'Signing in with Google from an existing anonymous account upgrades it in place, keeping the same account ID, reviews, topics and votes rather than creating a second account.',
    ],
    privacy: {
      gdpr: 'This site uses the core requirements of the GDPR as the data-protection baseline for every user, and meets its mandatory requirements wherever the GDPR has legal effect for a particular user or a particular processing activity.',
      linkIntro: 'For more on how your data is handled, see the',
      linkBetween: 'and the',
      linkEnd: '.',
      quoteOpen: '',
      quoteClose: '',
    },
  },
};

export default function LoginPage() {
  const { t, lang } = useI18n();
  const design = ACCOUNT_DESIGN[lang] ?? ACCOUNT_DESIGN.zh;
  const { user } = useAuth();
  const [loading, setLoading] = useState<'anonymous' | 'google' | null>(null);
  const [error, setError] = useState('');
  const [nextPath, setNextPath] = useState('/');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const requestedPath = new URLSearchParams(window.location.search).get('next');
      setNextPath(getSafeAccountNextPath(requestedPath));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const communityIntent = nextPath === '/community' || nextPath.startsWith('/community/');

  const handleAnonymousLogin = async () => {
    setLoading('anonymous');
    setError('');
    const { error: signInError } = await supabase.auth.signInAnonymously();
    if (signInError) {
      setError(signInError.message);
      setLoading(null);
      return;
    }
    window.location.assign(nextPath);
  };

  const handleGoogleLogin = async () => {
    setLoading('google');
    setError('');
    if (user && !user.is_anonymous) {
      window.location.assign(nextPath);
      return;
    }
    try {
      await startGoogleAuthentication(user, nextPath);
    } catch (googleError) {
      setError(googleError instanceof Error ? googleError.message : t('login.googleFailed'));
      setLoading(null);
    }
  };

  return (
    <div className="hero-grid flex min-h-[72vh] items-center justify-center px-4 py-16">
      {/* One column until there is room for two: the sign-in card keeps a fixed
          width and the explanation takes the remaining space. `items-start`
          stops the shorter card from stretching to the taller one. */}
      <div className="mx-auto grid w-full max-w-5xl items-start gap-6 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-rule bg-panel p-6 sm:p-8">
        <div className="text-center">
          <span className="gradient-button mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white">R</span>
          <p className="mt-5 text-[9px] font-bold uppercase tracking-[0.18em] text-cyan">RUNIPS / ACCOUNT</p>
          <h1 className="mt-3 text-2xl font-bold text-foreground">{t('login.welcome')}</h1>
          <p className="mt-2 text-xs leading-6 text-faint">{t('login.subtitle')}</p>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
        )}

        {googleAuthEnabled && (
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading !== null}
            className="gradient-button mt-7 flex w-full items-center justify-center gap-3 rounded-lg py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#fff" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.32 2.98-7.39Z" />
              <path fill="#fff" fillOpacity=".9" d="M12 22c2.7 0 4.97-.9 6.62-2.38l-3.24-2.53c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.6-4.12H3.06v2.6A10 10 0 0 0 12 22Z" />
              <path fill="#fff" fillOpacity=".75" d="M6.4 13.93A6 6 0 0 1 6.08 12c0-.67.12-1.32.32-1.93v-2.6H3.06A10 10 0 0 0 2 12c0 1.62.39 3.15 1.06 4.53l3.34-2.6Z" />
              <path fill="#fff" fillOpacity=".6" d="M12 5.95c1.47 0 2.78.5 3.82 1.49l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.94 5.47l3.34 2.6A5.98 5.98 0 0 1 12 5.95Z" />
            </svg>
            {loading === 'google'
              ? t('login.redirecting')
              : user?.is_anonymous
                ? t('login.upgradeGoogle')
                : t('login.google')}
          </button>
        )}

        {!googleAuthEnabled && communityIntent && (
          <p className="mt-6 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs leading-6 text-amber-200">
            {t('login.googleRequired')}
          </p>
        )}

        {!communityIntent && (
          <>
            {googleAuthEnabled && (
              <div className="my-5 flex items-center gap-3 text-xs text-faint">
                <span className="h-px flex-1 bg-rule" />
                <span>{t('login.or')}</span>
                <span className="h-px flex-1 bg-rule" />
              </div>
            )}
            <button
              type="button"
              onClick={handleAnonymousLogin}
              disabled={loading !== null}
              className={`${googleAuthEnabled ? '' : 'mt-7'} w-full rounded-lg border border-rule bg-background py-2.5 text-sm font-medium text-muted hover:text-foreground disabled:opacity-50`}
            >
              {loading === 'anonymous' ? t('login.anonymousLoading') : t('login.anonymous')}
            </button>
            <p className="mt-3 text-center text-[10px] leading-5 text-faint">{t('login.anonymousNote')}</p>
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

      <section className="rounded-2xl border border-rule bg-panel/60 p-5 sm:p-6">
        <h2 className="text-sm font-bold text-foreground">{design.title}</h2>
        <p className="mt-2 text-xs leading-6 text-faint">{design.intro}</p>

        {/* A four-column table does not fit a phone, and a sideways-scrolling
            one is easy to miss entirely, so narrow screens get the same rows as
            stacked cards instead. */}
        <div className="mt-4 hidden sm:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-rule">
                {design.columns.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="px-2 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-faint"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {design.rows.map((row) => (
                <tr key={row.role} className="border-b border-rule/60 last:border-0">
                  <th
                    scope="row"
                    className={`whitespace-pre-line px-2 py-2.5 text-xs font-semibold ${
                      row.highlight ? 'text-violet-300' : 'text-muted'
                    }`}
                  >
                    {row.role}
                  </th>
                  <td className="whitespace-pre-line px-2 py-2.5 text-xs leading-5 text-faint">{row.browse}</td>
                  <td className="whitespace-pre-line px-2 py-2.5 text-xs leading-5 text-faint">{row.post}</td>
                  <td className="whitespace-pre-line px-2 py-2.5 text-xs leading-5 text-faint">{row.review}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-4 space-y-3 sm:hidden">
          {design.rows.map((row) => (
            <li
              key={row.role}
              className={`rounded-xl border p-3 ${
                row.highlight ? 'border-violet/40 bg-violet/5' : 'border-rule bg-background/40'
              }`}
            >
              <p
                className={`whitespace-pre-line text-xs font-semibold ${
                  row.highlight ? 'text-violet-300' : 'text-muted'
                }`}
              >
                {row.role}
              </p>
              <dl className="mt-2 space-y-1">
                {([
                  [design.columns[1], row.browse],
                  [design.columns[2], row.post],
                  [design.columns[3], row.review],
                ] as const).map(([label, value]) => (
                  <div key={label} className="flex gap-2 text-[11px] leading-5">
                    <dt className="shrink-0 text-faint">{label}</dt>
                    <dd className="whitespace-pre-line text-right text-muted [margin-inline-start:auto]">{value}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>

        <ul className="mt-5 space-y-2.5">
          {design.notes.map((note) => (
            <li key={note} className="flex gap-2 text-[11px] leading-6 text-faint">
              <span aria-hidden className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-rule" />
              <span>{note}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 border-t border-rule pt-4">
          <p className="text-[11px] leading-6 text-faint">{design.privacy.gdpr}</p>
          <p className="mt-2 text-[11px] leading-6 text-faint">
            {design.privacy.linkIntro}
            {design.privacy.quoteOpen}
            <Link href="/privacy" className="font-semibold text-violet-300 hover:text-violet-200">
              {t('legal.privacy')}
            </Link>
            {design.privacy.quoteClose}
            {design.privacy.linkBetween}
            {design.privacy.quoteOpen}
            <Link href="/terms" className="font-semibold text-violet-300 hover:text-violet-200">
              {t('legal.terms')}
            </Link>
            {design.privacy.quoteClose}
            {design.privacy.linkEnd}
          </p>
        </div>
      </section>
      </div>
    </div>
  );
}
