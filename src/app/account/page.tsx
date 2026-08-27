'use client';

import AccountProfilePanel from '@/features/account/AccountProfilePanel';
import { getAccountCopy } from '@/features/account/copy';
import { useI18n } from '@/i18n/LanguageProvider';

export default function AccountPage() {
  const { lang } = useI18n();
  const copy = getAccountCopy(lang).page;

  return (
    <div className="hero-grid">
      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="border-b border-rule pb-8">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan">{copy.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">{copy.title}</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-muted">{copy.intro}</p>
        </header>
        <div className="mt-8">
          <AccountProfilePanel />
        </div>
      </main>
    </div>
  );
}

