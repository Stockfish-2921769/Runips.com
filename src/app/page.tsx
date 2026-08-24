'use client';

import { useEffect, useState } from 'react';
import RankingCard from '@/components/RankingCard';
import { ProfessorRankingItem, DIVISIONS } from '@/types';
import { supabase } from '@/lib/supabase';

type DivisionFilter = '全部' | (typeof DIVISIONS)[number];

const tabs: DivisionFilter[] = ['全部', ...DIVISIONS];

export default function Home() {
  const [activeTab, setActiveTab] = useState<DivisionFilter>('全部');
  const [items, setItems] = useState<ProfessorRankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string>('');

  const fetchRanking = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('professor_ranking')
      .select('*')
      .order('score', { ascending: false });

    if (!error && data) {
      setItems(data as ProfessorRankingItem[]);
      setUpdatedAt(new Date().toLocaleTimeString('ja-JP'));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRanking();
  }, []);

  const filtered = activeTab === '全部' ? items : items.filter((i) => i.division === activeTab);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-2xl p-8 mb-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">教授人气夯拉榜</h1>
        <p className="text-blue-100 text-sm md:text-base leading-relaxed max-w-2xl">
          基于谷歌学术引用数、互联网搜索量与本站点击量综合加权计算的实时排名。
        </p>
        <div className="flex gap-5 mt-4 text-xs text-blue-200">
          <span>📊 引用数 · 搜索数 · 点击数</span>
          <span>⏱ 最后更新 {updatedAt || '计算中...'}</span>
        </div>
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
            {tab === '全部' ? '全部' : tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>该分野暂无数据</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, index) => (
            <RankingCard key={item.id} item={item} rank={index + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
