'use client';

import Link from 'next/link';
import { useI18n } from '@/i18n/LanguageProvider';

export default function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-rule bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <span className="gradient-button flex h-7 w-7 items-center justify-center rounded-md text-xs text-white">R</span>
              RunIPS
            </div>
            <p className="mt-4 text-xs leading-6 text-faint">{t('footer.line')}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">{t('footer.explore')}</p>
            <div className="mt-4 space-y-3 text-xs text-faint">
              <Link href="/" className="block hover:text-foreground">{t('nav.home')}</Link>
              <Link href="/community/" className="block hover:text-foreground">{t('nav.community')}</Link>
              <Link href="/travel/" className="block hover:text-foreground">{t('footer.travelGuide')}</Link>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">{t('footer.information')}</p>
            <div className="mt-4 space-y-3 text-xs text-faint">
              <Link href="/privacy/" className="block hover:text-foreground">{t('legal.privacy')}</Link>
              <Link href="/terms/" className="block hover:text-foreground">{t('legal.terms')}</Link>
              <Link href="/account/" className="block hover:text-foreground">{t('common.account')}</Link>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">{t('footer.feedback')}</p>
            <div className="mt-4 space-y-3 text-xs text-faint">
              <Link href="/contact/" className="block font-semibold text-violet-300 hover:text-violet-200">{t('contact.footerAction')}</Link>
              <span className="block leading-5">{t('contact.footerNote')}</span>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-rule pt-6 text-[10px] text-faint">
          {t('footer.copyright', { year })}
        </div>
      </div>
    </footer>
  );
}
