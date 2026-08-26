'use client';

import Link from 'next/link';
import { useI18n } from '@/i18n/LanguageProvider';

export default function ContactIntroduction() {
  const { t } = useI18n();

  return (
    <section className="lg:sticky lg:top-28 lg:self-start">
      <Link href="/" className="text-[11px] text-faint hover:text-foreground">{t('legal.back')}</Link>
      <p className="mt-7 text-[9px] font-bold uppercase tracking-[0.18em] text-cyan">RUNIPS / CONTACT</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">{t('contact.title')}</h1>
      <p className="mt-5 text-sm leading-7 text-muted">{t('contact.desc')}</p>

      <div className="mt-7 space-y-3">
        {['feedback', 'privacy', 'content'].map((item, index) => (
          <div key={item} className="flex gap-3 rounded-lg border border-rule bg-panel/70 p-3 text-xs leading-6 text-muted">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-violet/40 bg-violet/10 font-mono text-[9px] text-violet-300">{index + 1}</span>
            <span>{t(`contact.scope.${item}`)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
