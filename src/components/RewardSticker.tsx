'use client';

import { useI18n } from '@/i18n/LanguageProvider';

/**
 * Standing callout for the trial-period review reward.
 *
 * The release dialog announces this once and is then gone for good; the reward
 * is the main reason a visitor would write a review, so it also needs somewhere
 * permanent. This sits in the page flow rather than pinned to the viewport — a
 * floating sticker would cover the search field on a phone, which is the one
 * thing the homepage exists to offer.
 *
 * The amounts carry the message, so they get the size and the accent. The
 * conditions ("after the full release", "three reviews") sit right beside them
 * rather than in fine print, because a reward that reads as unconditional and
 * then turns out not to be is worse than one that was never advertised.
 */
export default function RewardSticker() {
  const { t } = useI18n();

  return (
    <aside
      aria-labelledby="reward-sticker-title"
      className="relative mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-violet/35 bg-gradient-to-br from-violet/[0.12] via-panel to-cyan/[0.08] p-5 text-left sm:p-6"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          {/* Tilted so the block reads as something stuck on rather than another
              panel in the stack. */}
          <span
            aria-hidden="true"
            className="hidden h-11 w-11 shrink-0 -rotate-6 items-center justify-center rounded-xl border border-violet/40 bg-violet/15 text-xl sm:flex"
          >
            🎁
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-violet-300">
              {t('reward.badge')}
            </p>
            <h2 id="reward-sticker-title" className="mt-1.5 text-sm font-bold leading-6 text-foreground">
              {t('reward.title')}
            </h2>
            <p className="mt-1.5 text-xs leading-6 text-muted">{t('reward.body')}</p>
          </div>
        </div>

        <div className="shrink-0 border-t border-rule pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
          <p className="whitespace-nowrap text-base font-extrabold tabular-nums tracking-tight gradient-text sm:text-lg">
            {t('reward.amounts')}
          </p>
          <button
            type="button"
            onClick={() => document.getElementById('supervisor-directory')?.scrollIntoView({ behavior: 'smooth' })}
            className="gradient-button mt-3 w-full rounded-lg px-4 py-2 text-xs font-semibold text-white hover:opacity-90 sm:w-auto"
          >
            {t('reward.cta')}
          </button>
        </div>
      </div>

      <p className="mt-4 border-t border-rule/60 pt-3 text-[10px] leading-5 text-faint">
        {t('reward.note')}
      </p>
    </aside>
  );
}
