'use client';

import { useCallback, useEffect, useState } from 'react';
import RankingCard from '@/components/RankingCard';
import { ProfessorRankingItem, ProfessorRatingAvg, DIVISIONS } from '@/types';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/i18n/LanguageProvider';

type DivisionFilter = '全部' | (typeof DIVISIONS)[number];

export default function Home() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<DivisionFilter>('全部');
  const [items, setItems] = useState<ProfessorRankingItem[]>([]);
  const [ratingsMap, setRatingsMap] = useState<Record<number, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string>('');

  const fetchData = useCallback(() => {
    Promise.all([
      supabase.from('professors').select('*').order('click_count', { ascending: false }),
      supabase.from('professor_ratings_avg').select('*'),
    ]).then(([profRes, rateRes]) => {
      if (!profRes.error && profRes.data) {
        setItems(profRes.data as ProfessorRankingItem[]);
        setUpdatedAt(new Date().toLocaleTimeString('ja-JP'));
      }
      if (!rateRes.error && rateRes.data) {
        const map: Record<number, number[]> = {};
        for (const r of rateRes.data as ProfessorRatingAvg[]) {
          map[r.professor_id] = [r.opt_1_avg ?? 0, r.opt_2_avg ?? 0, r.opt_3_avg ?? 0, r.opt_4_avg ?? 0, r.opt_5_avg ?? 0, r.opt_6_avg ?? 0];
        }
        setRatingsMap(map);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs: DivisionFilter[] = ['全部', ...DIVISIONS];
  const filtered = activeTab === '全部' ? items : items.filter((i) => i.division === activeTab);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-2xl p-8 mb-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{t('hero.title')}</h1>
        <p className="text-blue-100 text-sm md:text-base leading-relaxed max-w-3xl whitespace-pre-line">{t('hero.desc')}</p>
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-gray-900">{t('home.title')}</h2>
        <span className="text-xs text-gray-400">{t('home.updated')} {updatedAt}</span>
      </div>

      <div className="flex items-center gap-1 mb-4 bg-white rounded-lg border border-gray-100 p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === '全部' ? t('tabs.all') : t(`division.${tab}` as never) || tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">{t('common.loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>{t('common.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, index) => (
            <RankingCard key={item.id} item={item} rank={index + 1} mode="clicks" ratings={ratingsMap[item.id]} />
          ))}
        </div>
      )}
    </div>
  );
}
