'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProfessorHexagon from '@/components/ProfessorHexagon';
import { useAuth } from '@/components/AuthProvider';
import { Professor, ProfessorRatingAvg, VoteRow, AXIS_LABELS } from '@/types';
import { supabase } from '@/lib/supabase';

const RATING_SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function ProfessorDetail({ id }: { id: string }) {
  const professorId = Number(id);
  const { user, loading: authLoading } = useAuth();

  const [professor, setProfessor] = useState<Professor | null>(null);
  const [ratings, setRatings] = useState<ProfessorRatingAvg | null>(null);
  const [myVote, setMyVote] = useState<VoteRow | null>(null);
  const [scores, setScores] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!professorId) return;

    let mounted = true;
    const load = async () => {
      const [profRes, rateRes] = await Promise.all([
        supabase.from('professors').select('*').eq('id', professorId).maybeSingle(),
        supabase.from('professor_ratings_avg').select('*').eq('professor_id', professorId).maybeSingle(),
      ]);

      if (mounted) {
        if (profRes.data) {
          setProfessor(profRes.data as Professor);
          if (rateRes.data) {
            const r = rateRes.data as ProfessorRatingAvg;
            setRatings(r);
            setScores([r.opt_1_avg ?? 0, r.opt_2_avg ?? 0, r.opt_3_avg ?? 0, r.opt_4_avg ?? 0, r.opt_5_avg ?? 0, r.opt_6_avg ?? 0]);
          }
        }
        setPageLoading(false);
      }
    };
    load();

    const key = `clicked_${professorId}`;
    if (!sessionStorage.getItem(key)) {
      supabase.rpc('increment_clicks', { p_professor_id: professorId }).then(() => {
        sessionStorage.setItem(key, '1');
      });
    }

    return () => {
      mounted = false;
    };
  }, [professorId]);

  useEffect(() => {
    if (!user || !professorId) return;
    supabase
      .from('votes')
      .select('*')
      .eq('professor_id', professorId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setMyVote(data as VoteRow);
          setScores([data.opt_1, data.opt_2, data.opt_3, data.opt_4, data.opt_5, data.opt_6]);
        }
      });
  }, [user, professorId]);

  const handleScore = (index: number, value: number) => {
    setScores((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    setNotice('');

    const payload = {
      professor_id: professorId,
      user_id: user.id,
      opt_1: scores[0],
      opt_2: scores[1],
      opt_3: scores[2],
      opt_4: scores[3],
      opt_5: scores[4],
      opt_6: scores[5],
    };

    let ok = false;
    if (myVote) {
      const { error } = await supabase.from('votes').update(payload).eq('id', myVote.id);
      ok = !error;
    } else {
      const { error } = await supabase.from('votes').insert(payload);
      ok = !error;
    }

    if (ok) {
      setNotice(myVote ? '投票已更新 ✅' : '投票成功 ✅');
      const { data } = await supabase
        .from('professor_ratings_avg')
        .select('*')
        .eq('professor_id', professorId)
        .maybeSingle();
      if (data) {
        const r = data as ProfessorRatingAvg;
        setRatings(r);
        setScores([r.opt_1_avg ?? 0, r.opt_2_avg ?? 0, r.opt_3_avg ?? 0, r.opt_4_avg ?? 0, r.opt_5_avg ?? 0, r.opt_6_avg ?? 0]);
      }
    } else {
      setNotice('投票失败，请稍后重试');
    }
    setSubmitting(false);
  };

  if (pageLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-400">加载中...</div>;
  }

  if (!professor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">教授不存在</h1>
        <Link href="/" className="text-blue-600 hover:underline">返回榜单</Link>
      </div>
    );
  }

  const hexagonValues = myVote
    ? [myVote.opt_1, myVote.opt_2, myVote.opt_3, myVote.opt_4, myVote.opt_5, myVote.opt_6]
    : scores;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link href="/" className="text-sm text-blue-600 hover:underline">← 返回人气榜</Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {professor.name[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{professor.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{professor.lab || '研究室未公开'}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">{professor.division}</span>
              <span>📖 引用 {professor.scholar_citations}</span>
              <span>🔍 搜索 {professor.search_count}</span>
              <span>👆 点击 {professor.click_count}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col items-center">
          <h2 className="font-semibold text-gray-900 mb-1">教师风评图</h2>
          <p className="text-xs text-gray-400 mb-4">
            {myVote ? '展示你的评分' : ratings?.vote_count ? `基于 ${ratings.vote_count} 位同学的投票平均值` : '暂无投票数据'}
          </p>
          <ProfessorHexagon values={hexagonValues} labels={[...AXIS_LABELS]} size={220} />
          <div className="grid grid-cols-3 gap-x-6 gap-y-1 mt-4">
            {AXIS_LABELS.map((label, i) => (
              <div key={label} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-gray-500">{label}</span>
                <span className="font-semibold text-gray-800">{(hexagonValues[i] ?? 0).toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">投票</h2>
            {myVote && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">已投票（可修改）</span>}
          </div>

          {!authLoading && !user ? (
            <div className="text-center py-10">
              <p className="text-gray-500 mb-4">登录后可参与投票</p>
              <Link href="/login" className="inline-block px-5 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition-colors">
                使用 Google 登录
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {AXIS_LABELS.map((label, i) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="w-6 text-sm font-medium text-gray-600">{label}</span>
                    <div className="flex gap-1 flex-1">
                      {RATING_SCALE.map((v) => (
                        <button
                          key={v}
                          onClick={() => handleScore(i, v)}
                          className={`flex-1 py-1 text-xs rounded transition-colors ${
                            scores[i] === v
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600'
                          }`}
                          title={`${v}分`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {notice && (
                <p className={`text-sm mt-4 text-center ${notice.includes('失败') ? 'text-red-600' : 'text-green-600'}`}>{notice}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || scores.some((s) => s <= 0)}
                className="w-full mt-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? '提交中...' : myVote ? '更新投票' : '提交投票'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
