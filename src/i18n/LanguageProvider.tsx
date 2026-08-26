'use client';

import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { translations, Lang } from '@/i18n/translations';

const STORAGE_KEY = 'runips-lang';
const languageListeners = new Set<() => void>();

function getLanguageSnapshot(): Lang {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem(STORAGE_KEY) === 'zh' ? 'zh' : 'en';
}

function subscribeToLanguage(listener: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) listener();
  };
  languageListeners.add(listener);
  window.addEventListener('storage', handleStorage);
  return () => {
    languageListeners.delete(listener);
    window.removeEventListener('storage', handleStorage);
  };
}

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dimensions: { label: string; desc: string }[];
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
  dimensions: [],
});

function resolve(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return path;
    }
  }
  return typeof cur === 'string' ? cur : path;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore<Lang>(subscribeToLanguage, getLanguageSnapshot, () => 'en');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved !== 'en' && saved !== 'zh') localStorage.removeItem(STORAGE_KEY);
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  }, [lang]);

  const setLang = (l: Lang) => {
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en';
    languageListeners.forEach((listener) => listener());
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = resolve(translations[lang] as unknown as Record<string, unknown>, key);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dimensions: translations[lang].dimensions }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
