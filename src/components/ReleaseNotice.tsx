'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/translations';

/**
 * Shown once per release, then not again until the version changes.
 *
 * Dedupe is per browser, not per IP. A campus network puts everybody behind one
 * address, so keying on IP would mean the first person to dismiss it hides the
 * announcement from every other student on that network — the opposite of the
 * intent. Keying on localStorage also keeps the site from collecting an IP for
 * a popup, which the Privacy Notice would otherwise have to account for.
 *
 * Bump RELEASE to show the next announcement.
 */
const RELEASE = '0.1.0';
const STORAGE_KEY = 'runips-release-seen';

interface ReleaseCopy {
  badge: string;
  title: string;
  intro: string;
  rewardTitle: string;
  rewardBody: string;
  rewardAmounts: string;
  giftBody: string;
  caveat: string;
  dismiss: string;
  close: string;
}

const COPY: Record<Lang, ReleaseCopy> = {
  zh: {
    badge: `v${RELEASE} · 测试中`,
    title: '欢迎来到 RunIPS',
    intro:
      '站点目前是 v0.1 测试版本，功能和数据都还在完善。你现在看到的内容可能会变，遇到问题或有建议都欢迎反馈。',
    rewardTitle: '我们鼓励贡献',
    rewardBody: '正式发布后，我们会从所有导师评价中选出 3 份最有价值的，给予现金奖励：',
    rewardAmounts: '10 USD / 1500 JPY / 65 CNY',
    giftBody: '其他贡献者会随机获得礼品。',
    caveat: '奖励在正式发布后发放，具体方式届时另行公布。评价内容仍然完全匿名，领取奖励不会公开你的身份。',
    dismiss: '知道了',
    close: '关闭',
  },
  en: {
    badge: `v${RELEASE} · in testing`,
    title: 'Welcome to RunIPS',
    intro:
      'This is the v0.1 test release — features and data are still being filled in. What you see may change, and reports or suggestions are welcome.',
    rewardTitle: 'Contributions are rewarded',
    rewardBody:
      'After the full release we will pick the three most valuable supervisor reviews and reward each with:',
    rewardAmounts: '10 USD / 1500 JPY / 65 CNY',
    giftBody: 'Other contributors receive gifts at random.',
    caveat:
      'Rewards are issued after the full release, with the process announced then. Reviews stay fully anonymous — claiming a reward does not publish who you are.',
    dismiss: 'Got it',
    close: 'Close',
  },
};

export default function ReleaseNotice() {
  const { lang } = useI18n();
  const copy = COPY[lang] ?? COPY.zh;
  const [open, setOpen] = useState(false);

  // Read after mount, never during render: the static export is prerendered for
  // everyone, so deciding at build time would flash the dialog on every visit.
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        if (localStorage.getItem(STORAGE_KEY) !== RELEASE) setOpen(true);
      } catch {
        // Storage can be blocked (private mode, strict settings). Staying quiet
        // is better than showing the same dialog on every page load.
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, RELEASE);
    } catch {
      // Dismissed for this page view only; nothing else to do.
    }
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/80 px-4 py-8"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="release-notice-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-rule bg-panel"
      >
        <div className="flex items-start justify-between gap-4 border-b border-rule px-5 py-5 sm:px-6">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-cyan">{copy.badge}</p>
            <h2 id="release-notice-title" className="mt-2 text-lg font-bold text-foreground">
              {copy.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label={copy.close}
            className="shrink-0 rounded-lg border border-rule px-2 py-1 text-xs text-faint hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <p className="text-xs leading-6 text-muted">{copy.intro}</p>

          <div className="rounded-xl border border-violet/30 bg-violet/[0.06] p-4">
            <p className="text-xs font-bold text-violet-300">{copy.rewardTitle}</p>
            <p className="mt-2 text-xs leading-6 text-muted">{copy.rewardBody}</p>
            <p className="mt-2 text-sm font-bold tabular-nums text-foreground">{copy.rewardAmounts}</p>
            <p className="mt-2 text-xs leading-6 text-muted">{copy.giftBody}</p>
          </div>

          <p className="text-[11px] leading-6 text-faint">{copy.caveat}</p>
        </div>

        <div className="border-t border-rule px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={dismiss}
            className="gradient-button w-full rounded-lg py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            {copy.dismiss}
          </button>
        </div>
      </section>
    </div>
  );
}
