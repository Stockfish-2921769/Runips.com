'use client';

import { useEffect, useState } from 'react';
import RankingCard from '@/components/RankingCard';
import { ProfessorRankingItem, ProfessorRatingAvg } from '@/types';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/i18n/LanguageProvider';

export default function RankingPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<ProfessorRankingItem[]>([]);
  const [ratingsMap, setRatingsMap] = useState<Record<number, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    Promise.all([
      supabase.from('professor_ranking').select('*').order('score', { ascending: false }),
      supabase.from('professor_ratings_avg').select('*'),
    ]).then(([rankRes, rateRes]) => {
      if (!rankRes.error && rankRes.data) {
        setItems(rankRes.data as ProfessorRankingItem[]);
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 rounded-2xl p-8 mb-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">🏆 {t('ranking.title')}</h1>
        <p className="text-purple-100 text-sm md:text-base leading-relaxed max-w-3xl">{t('ranking.desc')}</p>
        <div className="flex gap-5 mt-4 text-xs text-purple-200">
          <span>⏱ {t('common.updated')} {updatedAt || t('common.loading')}</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">{t('common.loading')}</div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <RankingCard key={item.id} item={item} rank={index + 1} mode="score" ratings={ratingsMap[item.id]} />
          ))}
        </div>
      )}
    </div>
  );
}
