'use client';

import Link from 'next/link';
import { LEGAL_DOCUMENTS, LegalDocumentKind } from '@/content/legal';
import { useI18n } from '@/i18n/LanguageProvider';

export default function LegalDocumentPage({ document }: { document: LegalDocumentKind }) {
  const { lang, t } = useI18n();
  const content = LEGAL_DOCUMENTS[lang][document];

  return (
    <div className="hero-grid">
      <article className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/" className="text-[11px] text-faint hover:text-foreground">{t('legal.back')}</Link>

        <header className="mt-6 border-b border-rule pb-8">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan">{content.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">{content.title}</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-muted">{content.summary}</p>
          <p className="mt-4 text-[10px] text-faint">{content.updatedLabel}: {content.updatedAt}</p>
        </header>

        <div className="divide-y divide-rule">
          {content.sections.map((section) => (
            <section key={section.title} className="py-8">
              <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-4 text-sm leading-7 text-muted">{paragraph}</p>
              ))}
              {section.bullets && (
                <ul className="mt-4 space-y-3">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3 text-sm leading-7 text-muted">
                      <span className="mt-3 h-1 w-1 shrink-0 rounded-full bg-violet-400" aria-hidden="true" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <aside className="rounded-xl border border-rule bg-panel p-5 text-sm text-muted">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <span>
              <span className="text-faint">{content.relatedLabel}: </span>
              <Link href={content.relatedHref} className="font-semibold text-violet-300 hover:text-violet-200">{content.relatedText}</Link>
            </span>
            <Link href="/contact" className="font-semibold text-violet-300 hover:text-violet-200">{t('legal.contact')}</Link>
            <Link href="/account/delete" className="font-semibold text-violet-300 hover:text-violet-200">{t('common.account')}</Link>
          </div>
          {content.references && (
            <div className="mt-4 border-t border-rule pt-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">{content.referenceLabel}</p>
              <div className="mt-2 flex flex-col gap-2">
                {content.references.map((reference) => (
                  <a
                    key={reference.href}
                    href={reference.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-violet-300 hover:text-violet-200"
                  >
                    {reference.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </aside>
      </article>
    </div>
  );
}
