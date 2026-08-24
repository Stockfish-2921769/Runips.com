export interface Professor {
  id: number;
  name: string;
  lab: string | null;
  division: string;
  scholar_citations: number;
  search_count: number;
  click_count: number;
  citations_updated_at: string | null;
  created_at: string;
}

export interface ProfessorRankingItem extends Professor {
  vote_count: number;
  score: number;
}

export interface ProfessorRatingAvg {
  professor_id: number;
  opt_1_avg: number | null;
  opt_2_avg: number | null;
  opt_3_avg: number | null;
  opt_4_avg: number | null;
  opt_5_avg: number | null;
  opt_6_avg: number | null;
  vote_count: number;
}

export interface VoteRow {
  id: number;
  professor_id: number;
  user_id: string;
  opt_1: number;
  opt_2: number;
  opt_3: number;
  opt_4: number;
  opt_5: number;
  opt_6: number;
  created_at: string;
  updated_at: string;
}

export const DIVISIONS = ['情報アーキテクチャ', '生産システム', '集積システム'] as const;

export const AXIS_LABELS = ['一', '二', '三', '四', '五', '六'] as const;
