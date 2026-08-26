'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useI18n } from '@/i18n/LanguageProvider';
import {
  FEEDBACK_CATEGORIES,
  FeedbackCategory,
  FeedbackDraft,
  submitFeedback,
} from './repository';

const EMPTY_FEEDBACK: FeedbackDraft = {
  category: 'general',
  message: '',
  replyContact: '',
  pageUrl: '',
  website: '',
};

export default function ContactForm() {
  const { lang, t } = useI18n();
  const [draft, setDraft] = useState<FeedbackDraft>(EMPTY_FEEDBACK);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const messageLength = draft.message.trim().length;
    if (messageLength < 5 || messageLength > 4000) {
      setError(t('contact.validationMessage'));
      return;
    }
    const replyLength = draft.replyContact.trim().length;
    if (replyLength > 0 && (replyLength < 3 || replyLength > 320)) {
      setError(t('contact.validationReply'));
      return;
    }

    setSubmitting(true);
    try {
      const nextReference = await submitFeedback(draft, lang);
      setReference(nextReference);
      setDraft(EMPTY_FEEDBACK);
    } catch {
      setError(t('contact.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (reference) {
    return (
      <section className="rounded-2xl border border-emerald-500/25 bg-panel p-6 sm:p-8" aria-live="polite">
        <span className="flex h-10 min-w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2 font-mono text-[9px] font-bold tracking-wider text-emerald-400" aria-hidden="true">SENT</span>
        <h2 className="mt-5 text-xl font-bold text-foreground">{t('contact.successTitle')}</h2>
        <p className="mt-2 text-sm leading-7 text-muted">{t('contact.successDesc')}</p>
        <div className="mt-5 rounded-lg border border-rule bg-background px-4 py-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-faint">{t('contact.reference')}</p>
          <p className="mt-2 break-all font-mono text-xs text-cyan">{reference}</p>
        </div>
        <button
          type="button"
          onClick={() => setReference('')}
          className="mt-6 rounded-lg border border-rule px-5 py-2.5 text-sm font-semibold text-muted hover:bg-rule hover:text-foreground"
        >
          {t('contact.sendAnother')}
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-rule bg-panel p-5 sm:p-8">
      <div className="rounded-lg border border-violet/30 bg-violet/10 p-4 text-xs leading-6 text-violet-200">
        {t('contact.privateNote')}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="text-xs font-semibold text-muted">
          {t('contact.category')}
          <select
            value={draft.category}
            onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value as FeedbackCategory }))}
            className="mt-2 w-full rounded-lg border border-rule bg-background px-3 py-3 text-sm font-normal text-muted outline-none focus:border-violet focus:ring-1 focus:ring-violet"
            required
          >
            {FEEDBACK_CATEGORIES.map((category) => (
              <option key={category} value={category}>{t(`contact.categories.${category}`)}</option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold text-muted">
          {t('contact.relatedPage')}
          <input
            type="text"
            value={draft.pageUrl}
            onChange={(event) => setDraft((current) => ({ ...current, pageUrl: event.target.value }))}
            maxLength={500}
            placeholder={t('contact.relatedPagePlaceholder')}
            className="mt-2 w-full rounded-lg border border-rule bg-background px-3 py-3 text-sm font-normal text-muted outline-none placeholder:text-faint focus:border-violet focus:ring-1 focus:ring-violet"
          />
        </label>
      </div>

      <label className="mt-5 block text-xs font-semibold text-muted">
        <span className="flex items-baseline justify-between gap-3">
          <span>{t('contact.message')}</span>
          <span className={`font-normal ${draft.message.length > 4000 ? 'text-red-400' : 'text-faint'}`}>{draft.message.length}/4000</span>
        </span>
        <textarea
          value={draft.message}
          onChange={(event) => setDraft((current) => ({ ...current, message: event.target.value }))}
          minLength={5}
          maxLength={4000}
          rows={9}
          required
          placeholder={t('contact.messagePlaceholder')}
          className="mt-2 w-full resize-y rounded-lg border border-rule bg-background px-4 py-3 text-sm font-normal leading-7 text-muted outline-none placeholder:text-faint focus:border-violet focus:ring-1 focus:ring-violet"
        />
        <span className="mt-2 block font-normal leading-5 text-faint">{t('contact.messageHint')}</span>
      </label>

      <label className="mt-5 block text-xs font-semibold text-muted">
        {t('contact.replyContact')}
        <input
          type="text"
          value={draft.replyContact}
          onChange={(event) => setDraft((current) => ({ ...current, replyContact: event.target.value }))}
          maxLength={320}
          placeholder={t('contact.replyContactPlaceholder')}
          className="mt-2 w-full rounded-lg border border-rule bg-background px-3 py-3 text-sm font-normal text-muted outline-none placeholder:text-faint focus:border-violet focus:ring-1 focus:ring-violet"
        />
        <span className="mt-2 block font-normal leading-5 text-faint">{t('contact.replyContactHint')}</span>
      </label>

      <label className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        Website
        <input
          type="text"
          name="website"
          value={draft.website}
          onChange={(event) => setDraft((current) => ({ ...current, website: event.target.value }))}
          tabIndex={-1}
          autoComplete="off"
        />
      </label>

      <p className="mt-5 text-[10px] leading-5 text-faint">
        {t('contact.legalNote')}{' '}
        <Link href="/privacy" className="font-semibold text-violet-300 hover:text-violet-200">{t('legal.privacy')}</Link>
        <span aria-hidden="true"> · </span>
        <Link href="/terms" className="font-semibold text-violet-300 hover:text-violet-200">{t('legal.terms')}</Link>
      </p>

      {error && <p className="mt-5 text-sm font-medium text-red-400" role="alert">{error}</p>}

      <div className="mt-6 border-t border-rule pt-5">
        <button
          type="submit"
          disabled={submitting}
          className="gradient-button w-full rounded-lg px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {submitting ? t('contact.submitting') : t('contact.submit')}
        </button>
      </div>
    </form>
  );
}
