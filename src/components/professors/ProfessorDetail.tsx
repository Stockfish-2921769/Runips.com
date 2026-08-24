'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProfessorHexagon from '@/components/ProfessorHexagon';
import { useAuth } from '@/components/AuthProvider';
import { useI18n } from '@/i18n/LanguageProvider';
import { Professor, ProfessorRatingAvg, VoteRow } from '@/types';
import { PROFESSOR_EN } from '@/data/professorNames';
import { supabase } from '@/lib/supabase';

const RATING_SCALE = [1, 2, 3, 4, 5, 6];
const PUBLIC_DIMS = 3;

export default function ProfessorDetail({ id }: { id: string }) {
  const professorId = Number(id);
  const { user, loading: authLoading } = useAuth();
  const { lang, t, dimensions } = useI18n();

  const [professor, setProfessor] = useState<Professor | null>(null);
  const [ratings, setRatings] = useState<ProfessorRatingAvg | null>(null);
  const [myVote, setMyVote] = useState<VoteRow | null>(null);
  const [scores, setScores] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [anonymousVoted, setAnonymousVoted] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(`runips_anon_voted_${Number(id)}`) === '1';
    }
    return false;
  });

  const anonKey = `runips_anon_voted_${professorId}`;

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
  }, [professorId, anonKey]);

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
    if (!user && index >= PUBLIC_DIMS) return;
    setScores((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  const handleSubmit = async () => {
    if (!professorId) return;
    setSubmitting(true);
    setNotice('');

    const isAnon = !user;
    const required = isAnon ? scores.slice(0, PUBLIC_DIMS) : scores;
    if (required.some((s) => s <= 0)) {
      setNotice(t('detail.failed'));
      setSubmitting(false);
      return;
    }

    let ok = false;
    if (isAnon) {
      const { error } = await supabase.from('votes').insert({
        professor_id: professorId,
        opt_1: scores[0],
        opt_2: scores[1],
        opt_3: scores[2],
      });
      ok = !error;
    } else if (myVote) {
      const { error } = await supabase.from('votes').update({
        opt_1: scores[0],
        opt_2: scores[1],
        opt_3: scores[2],
        opt_4: scores[3],
        opt_5: scores[4],
        opt_6: scores[5],
      }).eq('id', myVote.id);
      ok = !error;
    } else {
      const { error } = await supabase.from('votes').insert({
        professor_id: professorId,
        user_id: user!.id,
        opt_1: scores[0],
        opt_2: scores[1],
        opt_3: scores[2],
        opt_4: scores[3],
        opt_5: scores[4],
        opt_6: scores[5],
      });
      ok = !error;
    }

    if (ok) {
      if (isAnon) {
        sessionStorage.setItem(anonKey, '1');
        setAnonymousVoted(true);
        setNotice(t('detail.votedThanks'));
      } else {
        setNotice(myVote ? t('detail.updatedVote') : t('detail.success'));
      }
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
      setNotice(t('detail.failed'));
    }
    setSubmitting(false);
  };

  if (pageLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-400">{t('common.loading')}</div>;
  }

  if (!professor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('detail.notFound')}</h1>
        <Link href="/" className="text-blue-600 hover:underline">{t('detail.back')}</Link>
      </div>
    );
  }

  const en = PROFESSOR_EN[professor.id];
  const displayName =
    lang === 'en' && en ? en.nameEn :
    lang === 'ja' && en?.nameJa ? en.nameJa :
    professor.name;
  const displayLab = lang === 'en' && en?.labEn ? en.labEn : professor.lab || t('common.labUnknown');

  const axisLabels = dimensions.map((d) => d.label);
  const hexagonValues = myVote
    ? [myVote.opt_1, myVote.opt_2, myVote.opt_3, myVote.opt_4, myVote.opt_5, myVote.opt_6]
    : scores;

  const canVoteDims = (i: number) => user ? true : i < PUBLIC_DIMS;
  const isLocked = !user && !anonymousVoted && !myVote;
  const allLocked = anonymousVoted && !user;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link href="/" className="text-sm text-blue-600 hover:underline">{t('detail.back')}</Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {displayName[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-sm text-gray-500 mt-1">{displayLab}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">{t(`division.${professor.division}` as never) || professor.division}</span>
              <span>📖 {t('stats.citations')} {professor.scholar_citations ?? t('common.tbd')}</span>
              <span>🔍 {t('stats.search')} {professor.search_count}</span>
              <span>👆 {t('stats.clicks')} {professor.click_count}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col items-center">
          <h2 className="font-semibold text-gray-900 mb-1">{t('detail.hexagonTitle')}</h2>
          <p className="text-xs text-gray-400 mb-4">
            {myVote ? t('detail.myRating') : ratings?.vote_count ? t('detail.avgRating', { n: ratings.vote_count }) : t('detail.noVotes')}
          </p>
          <ProfessorHexagon values={hexagonValues} labels={axisLabels} size={240} />
          <div className="grid grid-cols-3 gap-x-6 gap-y-1 mt-4">
            {axisLabels.map((label, i) => (
              <div key={label} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-gray-500">{label}</span>
                <span className="font-semibold text-gray-800">{(hexagonValues[i] ?? 0).toFixed(1)}</span>
              </div>
            ))}
          </div>
          <div className="w-full mt-5 pt-4 border-t border-gray-50 space-y-1.5">
            {dimensions.map((d, i) => (
              <div key={d.label} className="flex items-start gap-2 text-xs">
                <span className="text-gray-500 font-medium whitespace-nowrap">{i + 1}. {d.label}</span>
                <span className="text-gray-400">{d.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{t('detail.voteTitle')}</h2>
            <div className="flex items-center gap-2">
              {myVote && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">{t('detail.voted')}</span>}
              {anonymousVoted && !user && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">{t('detail.anonymousDone')}</span>}
            </div>
          </div>

          <div className="space-y-3">
            {dimensions.map((d, i) => {
              const votable = canVoteDims(i);
              const locked = !votable && !myVote;
              return (
                <div key={d.label} className="flex items-center gap-3">
                  <span className={`w-5 text-sm font-medium ${votable ? 'text-gray-600' : 'text-gray-300'}`}>
                    {locked ? '🔒' : i + 1}
                  </span>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className={`text-xs font-medium mb-0.5 ${votable ? 'text-gray-700' : 'text-gray-300'}`}>{d.label}</span>
                    <div className={`flex gap-1 ${votable ? '' : 'opacity-40 pointer-events-none'}`}>
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
                </div>
              );
            })}
          </div>

          {isLocked && (
            <div className="mt-4 text-center bg-blue-50/60 rounded-lg py-3">
              <p className="text-xs text-gray-500 mb-2">{t('detail.loginLocked')}</p>
              <Link href="/login" className="inline-block px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs hover:bg-blue-700 transition-colors">
                {t('detail.loginWithGoogle')}
              </Link>
            </div>
          )}

          {!authLoading && !user && !isLocked && (
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">{t('detail.loginLocked')}</p>
              <Link href="/login" className="inline-block mt-2 px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs hover:bg-blue-700 transition-colors">
                {t('detail.loginWithGoogle')}
              </Link>
            </div>
          )}

          {notice && (
            <p className={`text-sm mt-4 text-center ${notice.includes('失敗') || notice.includes('失败') || notice.includes('fail') ? 'text-red-600' : 'text-green-600'}`}>{notice}</p>
          )}

          {!allLocked && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full mt-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? t('detail.submitting') : user ? (myVote ? t('detail.update') : t('detail.submit')) : t('detail.submit')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
