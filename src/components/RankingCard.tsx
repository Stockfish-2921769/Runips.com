'use client';

import Link from 'next/link';
import { ProfessorRankingItem } from '@/types';
import { PROFESSOR_EN } from '@/data/professorNames';
import { useI18n } from '@/i18n/LanguageProvider';

const divisionColors: Record<string, string> = {
  '情報アーキテクチャ': 'bg-blue-100 text-blue-700',
  '生産システム': 'bg-green-100 text-green-700',
  '集積システム': 'bg-purple-100 text-purple-700',
};

const rankColors = ['text-yellow-500', 'text-gray-400', 'text-orange-400'];

interface RankingCardProps {
  item: ProfessorRankingItem;
  rank: number;
  mode?: 'clicks' | 'score';
  ratings?: number[];
}

export default function RankingCard({ item, rank, mode = 'clicks', ratings = [] }: RankingCardProps) {
  const { lang, t, dimensions } = useI18n();
  const divisionColor = divisionColors[item.division] || 'bg-gray-100 text-gray-700';
  const divisionLabel = t(`division.${item.division}` as never) || item.division;
  const en = PROFESSOR_EN[item.id];
  const displayName =
    lang === 'en' && en ? en.nameEn :
    lang === 'ja' && en?.nameJa ? en.nameJa :
    item.name;
  const displayLab = lang === 'en' && en?.labEn ? en.labEn : item.lab || t('common.labUnknown');
  const hasRatings = ratings.some((v) => v > 0);

  return (
    <Link
      href={`/professors/${item.id}`}
      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all"
    >
      <div className={`w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center font-bold text-lg ${rank <= 3 ? rankColors[rank - 1] : 'text-gray-300'}`}>
        {rank}
      </div>

      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        {displayName[0]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 truncate">{displayName}</h3>
          <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${divisionColor}`}>{divisionLabel}</span>
        </div>
        <p className="text-xs text-gray-400 truncate mt-0.5">{displayLab}</p>
        <div className="flex items-center gap-3 mt-1.5 sm:hidden text-xs text-gray-400">
          <span>📖 {item.scholar_citations}</span>
          <span>🔍 {item.search_count}</span>
          <span>👆 {item.click_count}</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-3 gap-y-1 mt-2">
          {dimensions.map((d, i) => (
            <div key={d.label} className="flex items-baseline justify-between gap-1 min-w-0" title={d.label}>
              <span className="text-[10px] text-gray-400 truncate">{i + 1}.{d.label}</span>
              <span className={`text-xs font-bold ${hasRatings ? 'text-blue-600' : 'text-gray-300'}`}>
                {hasRatings ? (ratings[i] ?? 0).toFixed(1) : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-4 text-center flex-shrink-0">
        <div>
          <div className="text-sm font-semibold text-gray-700">{item.scholar_citations}</div>
          <div className="text-xs text-gray-400">{t('stats.citations')}</div>
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-700">{item.search_count}</div>
          <div className="text-xs text-gray-400">{t('stats.search')}</div>
        </div>
        <div>
          <div className={`text-sm font-bold ${mode === 'clicks' ? 'text-blue-600' : 'text-gray-700'}`}>{item.click_count}</div>
          <div className="text-xs text-gray-400">{t('stats.clicks')}</div>
        </div>
        {mode === 'score' && (
          <div>
            <div className="text-lg font-bold text-blue-600">{item.score}</div>
            <div className="text-xs text-gray-400">{t('stats.score')}</div>
          </div>
        )}
      </div>
    </Link>
  );
}
