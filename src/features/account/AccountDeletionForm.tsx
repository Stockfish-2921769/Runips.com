'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useI18n } from '@/i18n/LanguageProvider';
import { translations } from '@/i18n/translations';
import {
  ACCOUNT_DELETION_CONFIRMATION,
  deleteCurrentAccount,
} from './repository';

export default function AccountDeletionForm() {
  const { user, loading } = useAuth();
  const { lang, t } = useI18n();
  const [confirmation, setConfirmation] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState('');

  if (loading) {
    return <div className="py-16 text-center text-sm text-faint">{t('common.loading')}</div>;
  }

  if (deleted) {
    return (
      <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-300">COMPLETE</p>
        <h2 className="mt-3 text-xl font-bold text-foreground">{t('account.successTitle')}</h2>
        <p className="mt-3 text-sm leading-7 text-muted">{t('account.successDesc')}</p>
        <Link href="/" className="mt-6 inline-flex rounded-lg border border-rule px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-panel-raised">
          {t('account.returnHome')}
        </Link>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="rounded-xl border border-rule bg-panel p-6">
        <h2 className="text-xl font-bold text-foreground">{t('account.signedOutTitle')}</h2>
        <p className="mt-3 text-sm leading-7 text-muted">{t('account.signedOutDesc')}</p>
        <Link href="/login/?next=%2Faccount%2Fdelete%2F" className="gradient-button mt-6 inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
          {t('account.signIn')}
        </Link>
      </section>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (confirmation !== ACCOUNT_DELETION_CONFIRMATION || !acknowledged) {
      setError(t('account.mismatch'));
      return;
    }

    setSubmitting(true);
    try {
      await deleteCurrentAccount();
      setDeleted(true);
    } catch {
      setError(t('account.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-rule bg-panel p-5 sm:p-6">
        <h2 className="text-sm font-bold text-foreground">{t('account.dataTitle')}</h2>
        <ul className="mt-4 space-y-3">
          {translations[lang].account.dataItems.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-6 text-muted">
              <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-violet-400" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-rule bg-panel p-5 sm:p-6">
        <h2 className="text-sm font-bold text-foreground">{t('account.backupTitle')}</h2>
        <p className="mt-3 text-xs leading-6 text-faint">{t('account.backupNote')}</p>
      </section>

      <form onSubmit={handleSubmit} className="rounded-xl border border-red-500/30 bg-red-500/5 p-5 sm:p-6">
        <label className="block text-xs font-semibold text-muted">
          {t('account.confirmLabel')}
          <input
            type="text"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={t('account.confirmPlaceholder')}
            autoComplete="off"
            spellCheck={false}
            disabled={submitting}
            className="mt-2 w-full rounded-lg border border-rule bg-background px-3 py-2.5 font-mono text-sm text-foreground outline-none placeholder:text-faint focus:border-red-400 focus:ring-1 focus:ring-red-400 disabled:opacity-50"
          />
        </label>

        <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-6 text-muted">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            disabled={submitting}
            className="mt-1 h-4 w-4 rounded border-rule bg-background text-red-500 focus:ring-red-500"
          />
          <span>{t('account.acknowledge')}</span>
        </label>

        {error && <p className="mt-4 text-sm font-medium text-red-300" role="alert">{error}</p>}

        <button
          type="submit"
          disabled={submitting || confirmation !== ACCOUNT_DELETION_CONFIRMATION || !acknowledged}
          className="mt-5 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? t('account.submitting') : t('account.submit')}
        </button>
      </form>
    </div>
  );
}
