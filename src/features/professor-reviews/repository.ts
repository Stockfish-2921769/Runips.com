import { supabase } from '@/lib/supabase';
import {
  CommunicationLanguage,
  DimensionRating,
  ProfessorReview,
  ProfessorReviewDraft,
  ProfessorReviewSummary,
  ProfessorReviewsSnapshot,
  RelationshipStatus,
  ReviewTag,
  ReviewVoteValue,
  StudentLevel,
  isDimensionAnswered,
  summarizeProfessorReviews,
} from './model';

interface PublicReviewRow {
  id: number;
  professor_id: number;
  overall_rating: number;
  pressure_rating: number;
  supervision_rating: number | null;
  communication_rating: number | null;
  autonomy_rating: number | null;
  lab_culture_rating: number | null;
  research_support_rating: number | null;
  career_support_rating: number | null;
  would_choose_again: boolean;
  student_level: StudentLevel | null;
  relationship_status: RelationshipStatus | null;
  communication_language: CommunicationLanguage | null;
  tags: ReviewTag[] | null;
  comment: string;
  helpful_count: number | null;
  unhelpful_count: number | null;
  created_at: string;
  updated_at: string;
}

interface ViewerVoteRow {
  review_id: number;
  value: ReviewVoteValue;
}

interface ReviewSummaryRow {
  professor_id: number;
  review_count: number;
  overall_average: number | null;
  pressure_average: number | null;
  would_choose_again_percent: number | null;
  supervision_average: number | null;
  communication_average: number | null;
  autonomy_average: number | null;
  lab_culture_average: number | null;
  research_support_average: number | null;
  career_support_average: number | null;
  supervision_count: number | null;
  communication_count: number | null;
  autonomy_count: number | null;
  lab_culture_count: number | null;
  research_support_count: number | null;
  career_support_count: number | null;
}

const MISSING_RESOURCE_CODES = new Set(['42P01', 'PGRST200', 'PGRST205']);

function isMissingReviewResource(error: { code?: string } | null): boolean {
  return !!error?.code && MISSING_RESOURCE_CODES.has(error.code);
}

function toDimension(value: number | null): DimensionRating {
  return value === null ? null : Number(value);
}

function mapReview(row: PublicReviewRow, viewerVote: ReviewVoteValue | null = null): ProfessorReview {
  return {
    id: row.id,
    professorId: row.professor_id,
    overallRating: Number(row.overall_rating),
    pressureRating: Number(row.pressure_rating),
    // Number(null) is 0, which would turn "not applicable" into the lowest
    // possible score, so nulls are carried through untouched.
    supervisionRating: toDimension(row.supervision_rating),
    communicationRating: toDimension(row.communication_rating),
    autonomyRating: toDimension(row.autonomy_rating),
    labCultureRating: toDimension(row.lab_culture_rating),
    researchSupportRating: toDimension(row.research_support_rating),
    careerSupportRating: toDimension(row.career_support_rating),
    wouldChooseAgain: row.would_choose_again,
    studentLevel: row.student_level,
    relationshipStatus: row.relationship_status,
    communicationLanguage: row.communication_language,
    tags: row.tags ?? [],
    comment: row.comment,
    helpfulCount: Number(row.helpful_count ?? 0),
    unhelpfulCount: Number(row.unhelpful_count ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    viewerVote,
  };
}

/**
 * `0` means the reviewer never touched that dimension. Writing it would fail the
 * 1-5 check constraint anyway, but failing here says which state was wrong
 * instead of surfacing a database error.
 */
function dimensionForWrite(value: DimensionRating): number | null {
  if (value === null) return null;
  if (!isDimensionAnswered(value)) {
    throw new Error('Every dimension needs a score or an explicit "not applicable"');
  }
  return value;
}

function draftPayload(professorId: number, draft: ProfessorReviewDraft) {
  return {
    professor_id: professorId,
    overall_rating: draft.overallRating,
    pressure_rating: draft.pressureRating,
    supervision_rating: dimensionForWrite(draft.supervisionRating),
    communication_rating: dimensionForWrite(draft.communicationRating),
    autonomy_rating: dimensionForWrite(draft.autonomyRating),
    lab_culture_rating: dimensionForWrite(draft.labCultureRating),
    research_support_rating: dimensionForWrite(draft.researchSupportRating),
    career_support_rating: dimensionForWrite(draft.careerSupportRating),
    would_choose_again: draft.wouldChooseAgain,
    student_level: draft.studentLevel,
    relationship_status: draft.relationshipStatus,
    communication_language: draft.communicationLanguage,
    tags: draft.tags,
    comment: draft.comment.trim(),
  };
}

export async function getProfessorReviews(
  professorId: number,
  userId?: string,
): Promise<ProfessorReviewsSnapshot> {
  const publicResult = await supabase
    .from('professor_reviews_public')
    .select('*')
    .eq('professor_id', professorId)
    .order('created_at', { ascending: false });

  if (publicResult.error) {
    if (isMissingReviewResource(publicResult.error)) {
      return {
        reviews: [],
        myReview: null,
        summary: summarizeProfessorReviews(professorId, []),
        available: false,
      };
    }
    throw publicResult.error;
  }

  const rows = (publicResult.data ?? []) as PublicReviewRow[];
  let votes = new Map<number, ReviewVoteValue>();
  let myReview: ProfessorReview | null = null;

  if (userId) {
    const reviewIds = rows.map((row) => row.id);
    const [voteResult, ownReviewResult] = await Promise.all([
      reviewIds.length > 0
        ? supabase.from('professor_review_votes').select('review_id,value').in('review_id', reviewIds)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from('professor_reviews')
        .select('*')
        .eq('professor_id', professorId)
        .maybeSingle(),
    ]);

    if (!voteResult.error) {
      votes = new Map(
        ((voteResult.data ?? []) as ViewerVoteRow[]).map((vote) => [vote.review_id, vote.value]),
      );
    }

    if (!ownReviewResult.error && ownReviewResult.data) {
      const ownRow = ownReviewResult.data as PublicReviewRow;
      const publicVersion = rows.find((row) => row.id === ownRow.id);
      myReview = mapReview(publicVersion ?? ownRow, votes.get(ownRow.id) ?? null);
    }
  }

  const reviews = rows.map((row) => mapReview(row, votes.get(row.id) ?? null));

  return {
    reviews,
    myReview,
    summary: summarizeProfessorReviews(professorId, reviews),
    available: true,
  };
}

export async function getAllProfessorReviewSummaries(): Promise<Record<number, ProfessorReviewSummary>> {
  const { data, error } = await supabase.from('professor_review_summaries').select('*');
  if (error) {
    if (isMissingReviewResource(error)) return {};
    throw error;
  }

  const summaries: Record<number, ProfessorReviewSummary> = {};
  for (const row of (data ?? []) as ReviewSummaryRow[]) {
    summaries[row.professor_id] = {
      professorId: row.professor_id,
      reviewCount: Number(row.review_count),
      overallAverage: row.overall_average === null ? null : Number(row.overall_average),
      pressureAverage: row.pressure_average === null ? null : Number(row.pressure_average),
      wouldChooseAgainPercent: row.would_choose_again_percent === null ? null : Number(row.would_choose_again_percent),
      dimensionAverages: {
        supervision: row.supervision_average === null ? null : Number(row.supervision_average),
        communication: row.communication_average === null ? null : Number(row.communication_average),
        autonomy: row.autonomy_average === null ? null : Number(row.autonomy_average),
        labCulture: row.lab_culture_average === null ? null : Number(row.lab_culture_average),
        researchSupport: row.research_support_average === null ? null : Number(row.research_support_average),
        careerSupport: row.career_support_average === null ? null : Number(row.career_support_average),
      },
      dimensionCounts: {
        supervision: Number(row.supervision_count ?? 0),
        communication: Number(row.communication_count ?? 0),
        autonomy: Number(row.autonomy_count ?? 0),
        labCulture: Number(row.lab_culture_count ?? 0),
        researchSupport: Number(row.research_support_count ?? 0),
        careerSupport: Number(row.career_support_count ?? 0),
      },
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      topTags: [],
    };
  }
  return summaries;
}

export async function saveProfessorReview(
  professorId: number,
  draft: ProfessorReviewDraft,
): Promise<void> {
  const { error } = await supabase
    .from('professor_reviews')
    .upsert(draftPayload(professorId, draft), { onConflict: 'professor_id,user_id' });

  if (error) throw error;
}

export async function setProfessorReviewVote(
  reviewId: number,
  value: ReviewVoteValue | null,
): Promise<void> {
  if (value === null) {
    const { error } = await supabase
      .from('professor_review_votes')
      .delete()
      .eq('review_id', reviewId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('professor_review_votes')
    .upsert({ review_id: reviewId, value }, { onConflict: 'review_id,user_id' });
  if (error) throw error;
}

export async function reportProfessorReview(reviewId: number, reason: string): Promise<void> {
  const { error } = await supabase
    .from('professor_review_reports')
    .upsert({ review_id: reviewId, reason }, { onConflict: 'review_id,user_id' });
  if (error) throw error;
}
