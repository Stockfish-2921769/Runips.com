'use client';

import Link from 'next/link';
import { ProfessorRankingItem } from '@/types';

const divisionColors: Record<string, string> = {
  '情報アーキテクチャ': 'bg-blue-100 text-blue-700',
  '生産システム': 'bg-green-100 text-green-700',
  '集積システム': 'bg-purple-100 text-purple-700',
};

const rankColors = ['text-yellow-500', 'text-gray-400', 'text-orange-400'];

export default function RankingCard({ item, rank }: { item: ProfessorRankingItem; rank: number }) {
  const divisionColor = divisionColors[item.division] || 'bg-gray-100 text-gray-700';

  return (
    <Link
      href={`/professors/${item.id}`}
      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all"
    >
      <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center font-bold text-lg ${rank <= 3 ? rankColors[rank - 1] : 'text-gray-300'}`}>
        {rank}
      </div>

      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        {item.name[0]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
          <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${divisionColor}`}>{item.division}</span>
        </div>
        <p className="text-xs text-gray-400 truncate mt-0.5">{item.lab || '研究室未公开'}</p>
      </div>

      <div className="hidden sm:flex items-center gap-5 text-center flex-shrink-0">
        <div>
          <div className="text-sm font-semibold text-gray-700">{item.scholar_citations}</div>
          <div className="text-xs text-gray-400">引用</div>
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-700">{item.search_count}</div>
          <div className="text-xs text-gray-400">搜索</div>
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-700">{item.click_count}</div>
          <div className="text-xs text-gray-400">点击</div>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className="text-xl font-bold text-blue-600">{item.score}</div>
        <div className="text-xs text-gray-400">综合分</div>
      </div>
    </Link>
  );
}
