'use client';

import Link from 'next/link';
import AccountDeletionForm from '@/features/account/AccountDeletionForm';
import { useI18n } from '@/i18n/LanguageProvider';

export default function DeleteAccountPage() {
  const { t } = useI18n();

  return (
    <div className="hero-grid">
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/privacy" className="text-[11px] text-faint hover:text-foreground">
          {t('account.privacyLink')}
        </Link>
        <header className="mt-6 border-b border-rule pb-8">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan">RUNIPS / ACCOUNT</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">{t('account.title')}</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-muted">
            {t('account.intro')}
          </p>
        </header>
        <div className="mt-8">
          <AccountDeletionForm />
        </div>
      </main>
    </div>
  );
}
