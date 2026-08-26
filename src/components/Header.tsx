'use client';

import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useI18n } from '@/i18n/LanguageProvider';
import { Lang } from '@/i18n/translations';

const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const { user, loading } = useAuth();
  const { lang, setLang, t } = useI18n();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserMenu(false);
    window.location.href = '/';
  };

  const userInitial = user?.is_anonymous
    ? 'R'
    : user?.user_metadata?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-50 border-b border-rule/70 bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3 text-ink" aria-label="RunIPS home">
          <span className="gradient-button flex h-8 w-8 items-center justify-center rounded-lg text-sm font-extrabold text-white">R</span>
          <span className="hidden min-[390px]:block">
            <span className="block text-sm font-bold leading-none text-foreground">RunIPS</span>
            <span className="mt-1 block text-[8px] font-semibold tracking-[0.16em] text-faint">WASEDA IPS GUIDE</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <Link href="/" className="text-xs font-medium text-muted hover:text-foreground">{t('nav.home')}</Link>
          <Link href="/community" className="text-xs font-medium text-muted hover:text-foreground">{t('nav.community')}</Link>
          <Link href="/travel" className="text-xs font-medium text-muted hover:text-foreground">{lang === 'zh' ? '旅行指南' : 'Travel Guide'}</Link>
          <Link href="/contact" className="text-xs font-medium text-muted hover:text-foreground">{t('nav.contact')}</Link>
        </nav>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex items-center rounded-md border border-rule bg-panel p-0.5" aria-label="Language">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                aria-pressed={lang === l.code}
                className={`rounded px-1.5 py-1 text-[10px] sm:px-2 ${
                  lang === l.code ? 'bg-rule font-semibold text-foreground' : 'text-faint hover:text-muted'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {loading ? null : user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenu(!userMenu)}
                className="flex items-center px-1 py-1"
                aria-label={user.is_anonymous ? t('login.guest') : user.user_metadata?.name || user.email || 'Account'}
                aria-expanded={userMenu}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-rule bg-panel text-xs font-bold text-foreground">
                  {userInitial}
                </div>
              </button>
              {userMenu && (
                <div className="absolute right-0 z-50 mt-2 w-44 rounded-lg border border-rule bg-panel-raised p-1">
                  <div className="truncate border-b border-rule px-3 py-2 text-sm text-muted">
                    {user.is_anonymous ? t('login.guest') : user.user_metadata?.name || user.email}
                  </div>
                  <Link
                    href="/account/delete"
                    onClick={() => setUserMenu(false)}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm text-muted hover:bg-rule hover:text-foreground"
                  >
                    {t('common.account')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-md px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10"
                  >
                    {t('common.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="gradient-button rounded-lg px-3 py-2 text-xs font-semibold text-white hover:opacity-90 sm:px-4">{t('login.action')}</Link>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-muted hover:text-foreground md:hidden"
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-rule bg-background md:hidden">
          <div className="divide-y divide-rule px-4">
            <Link href="/" className="block py-3 text-sm font-medium text-muted hover:text-foreground" onClick={() => setMenuOpen(false)}>{t('nav.home')}</Link>
            <Link href="/community" className="block py-3 text-sm font-medium text-muted hover:text-foreground" onClick={() => setMenuOpen(false)}>{t('nav.community')}</Link>
            <Link href="/travel" className="block py-3 text-sm font-medium text-muted hover:text-foreground" onClick={() => setMenuOpen(false)}>{lang === 'zh' ? '旅行指南' : 'Travel Guide'}</Link>
            <Link href="/contact" className="block py-3 text-sm font-medium text-muted hover:text-foreground" onClick={() => setMenuOpen(false)}>{t('nav.contact')}</Link>
          </div>
        </div>
      )}
    </header>
  );
}
