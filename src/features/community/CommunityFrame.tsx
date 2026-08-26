'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { useI18n } from '@/i18n/LanguageProvider';
import { getCommunityCopy } from './copy';

type CommunityRoute = 'browse' | 'ask' | 'notifications';

interface CommunityFrameProps {
  active?: CommunityRoute;
  children: ReactNode;
  compactHeader?: boolean;
}

const ROUTES: { key: CommunityRoute; href: string }[] = [
  { key: 'browse', href: '/community/' },
  { key: 'ask', href: '/community/new/' },
  { key: 'notifications', href: '/community/notifications/' },
];

export default function CommunityFrame({
  active,
  children,
  compactHeader = false,
}: CommunityFrameProps) {
  const { lang } = useI18n();
  const copy = getCommunityCopy(lang);

  return (
    <div className="min-h-[72vh] bg-background">
      <header className="border-b border-rule bg-panel">
        <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${compactHeader ? 'py-7' : 'py-9 sm:py-11'}`}>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan">{copy.eyebrow}</p>
          {!compactHeader && (
            <>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                {copy.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{copy.intro}</p>
            </>
          )}

          <nav className={`${compactHeader ? 'mt-4' : 'mt-7'} flex flex-wrap gap-1`} aria-label={copy.title}>
            {ROUTES.map((route) => {
              const selected = active === route.key;
              return (
                <Link
                  key={route.key}
                  href={route.href}
                  aria-current={selected ? 'page' : undefined}
                  className={`rounded-md px-3 py-2 text-xs font-semibold ${
                    selected
                      ? 'bg-rule text-foreground'
                      : 'text-faint hover:bg-background hover:text-foreground'
                  }`}
                >
                  {copy.nav[route.key]}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
