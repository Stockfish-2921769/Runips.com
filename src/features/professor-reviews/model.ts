export const REVIEW_DIMENSION_KEYS = [
  'supervision',
  'communication',
  'autonomy',
  'labCulture',
  'researchSupport',
  'careerSupport',
] as const;

export type ReviewDimensionKey = (typeof REVIEW_DIMENSION_KEYS)[number];

/**
 * A dimension score has three states, not two.
 *
 * `1`–`5`  the reviewer rated it
 * `null`   not applicable — the reviewer had no basis to judge this one, so it
 *          is excluded from every average rather than counted as a low score
 * `0`      not answered yet; only ever appears in an unsubmitted draft
 *
 * The distinction between `null` and `0` is the whole point: someone who was
 * never a core lab member cannot speak to career support, and a guessed number
 * from them is indistinguishable from first-hand experience once averaged.
 */
export type DimensionRating = number | null;

/** True once the reviewer has made a choice — a score or an explicit "N/A". */
export function isDimensionAnswered(value: DimensionRating): boolean {
  return value === null || (value >= 1 && value <= 5);
}

/**
 * Which of the five pressure captions an average lands in.
 *
 * The form asks for pressure in words ("较大") rather than 1–5, because a high
 * number there is not a good score. Averages are still numeric, so the reading
 * has to be mapped back onto the same five words — otherwise the page answers
 * a question the form never asked.
 */
export function pressureBandIndex(value: number): number {
  return Math.min(4, Math.max(0, Math.round(value) - 1));
}

export const REVIEW_TAGS = [
  'clearDirection',
  'timelyFeedback',
  'highAutonomy',
  'structuredGuidance',
  'highExpectations',
  'collaborativeLab',
  'internationalLab',
  'publicationFocused',
  'careerSupport',
  'handsOn',
  'flexibleSchedule',
  'highWorkload',
] as const;

export type ReviewTag = (typeof REVIEW_TAGS)[number];
export type StudentLevel = 'masters' | 'doctoral' | 'researchStudent' | 'other';
export type RelationshipStatus = 'current' | 'former';
export type CommunicationLanguage = 'ja' | 'en' | 'zh' | 'mixed' | 'other';
export type ReviewSort = 'newest' | 'helpful' | 'highest' | 'lowest';
export type ReviewVoteValue = -1 | 1;

export interface ProfessorReview {
  id: number;
  professorId: number;
  overallRating: number;
  pressureRating: number;
  supervisionRating: DimensionRating;
  communicationRating: DimensionRating;
  autonomyRating: DimensionRating;
  labCultureRating: DimensionRating;
  researchSupportRating: DimensionRating;
  careerSupportRating: DimensionRating;
  wouldChooseAgain: boolean;
  studentLevel: StudentLevel | null;
  relationshipStatus: RelationshipStatus | null;
  communicationLanguage: CommunicationLanguage | null;
  tags: ReviewTag[];
  comment: string;
  helpfulCount: number;
  unhelpfulCount: number;
  createdAt: string;
  updatedAt: string;
  viewerVote: ReviewVoteValue | null;
}

export interface ProfessorReviewDraft {
  overallRating: number;
  pressureRating: number;
  supervisionRating: DimensionRating;
  communicationRating: DimensionRating;
  autonomyRating: DimensionRating;
  labCultureRating: DimensionRating;
  researchSupportRating: DimensionRating;
  careerSupportRating: DimensionRating;
  wouldChooseAgain: boolean | null;
  // No longer asked for. The fields stay on the draft so editing an older
  // review carries its answers through untouched instead of silently clearing
  // them; new reviews simply leave them null.
  studentLevel: StudentLevel | null;
  relationshipStatus: RelationshipStatus | null;
  communicationLanguage: CommunicationLanguage | null;
  tags: ReviewTag[];
  comment: string;
}

export interface ProfessorReviewSummary {
  professorId: number;
  reviewCount: number;
  overallAverage: number | null;
  pressureAverage: number | null;
  wouldChooseAgainPercent: number | null;
  dimensionAverages: Record<ReviewDimensionKey, number | null>;
  /** How many reviewers rated each dimension, ignoring those who marked it N/A. */
  dimensionCounts: Record<ReviewDimensionKey, number>;
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
  topTags: { tag: ReviewTag; count: number }[];
}

export interface ProfessorReviewsSnapshot {
  reviews: ProfessorReview[];
  myReview: ProfessorReview | null;
  summary: ProfessorReviewSummary;
  available: boolean;
}

export const EMPTY_REVIEW_DRAFT: ProfessorReviewDraft = {
  overallRating: 0,
  pressureRating: 0,
  supervisionRating: 0,
  communicationRating: 0,
  autonomyRating: 0,
  labCultureRating: 0,
  researchSupportRating: 0,
  careerSupportRating: 0,
  wouldChooseAgain: null,
  studentLevel: null,
  relationshipStatus: null,
  communicationLanguage: null,
  tags: [],
  comment: '',
};

export function reviewToDraft(review: ProfessorReview): ProfessorReviewDraft {
  return {
    overallRating: review.overallRating,
    pressureRating: review.pressureRating,
    supervisionRating: review.supervisionRating,
    communicationRating: review.communicationRating,
    autonomyRating: review.autonomyRating,
    labCultureRating: review.labCultureRating,
    researchSupportRating: review.researchSupportRating,
    careerSupportRating: review.careerSupportRating,
    wouldChooseAgain: review.wouldChooseAgain,
    studentLevel: review.studentLevel,
    relationshipStatus: review.relationshipStatus,
    communicationLanguage: review.communicationLanguage,
    tags: [...review.tags],
    comment: review.comment,
  };
}

export function emptyReviewSummary(professorId: number): ProfessorReviewSummary {
  return {
    professorId,
    reviewCount: 0,
    overallAverage: null,
    pressureAverage: null,
    wouldChooseAgainPercent: null,
    dimensionAverages: {
      supervision: null,
      communication: null,
      autonomy: null,
      labCulture: null,
      researchSupport: null,
      careerSupport: null,
    },
    dimensionCounts: {
      supervision: 0,
      communication: 0,
      autonomy: 0,
      labCulture: 0,
      researchSupport: 0,
      careerSupport: 0,
    },
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    topTags: [],
  };
}

export function summarizeProfessorReviews(
  professorId: number,
  reviews: ProfessorReview[],
): ProfessorReviewSummary {
  if (reviews.length === 0) return emptyReviewSummary(professorId);

  const average = (values: number[]) =>
    Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 10) / 10;
  // Reviewers who marked a dimension not applicable are dropped before averaging
  // rather than counted as zero, and a dimension nobody could rate has no score
  // at all. This mirrors what avg() does in `professor_review_summaries`.
  const rated = (pick: (review: ProfessorReview) => DimensionRating) =>
    reviews.map(pick).filter((value): value is number => value !== null && value > 0);
  const dimensionAverage = (pick: (review: ProfessorReview) => DimensionRating) => {
    const values = rated(pick);
    return values.length > 0 ? average(values) : null;
  };
  const tagCounts = new Map<ReviewTag, number>();
  const ratingDistribution: ProfessorReviewSummary['ratingDistribution'] = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  for (const review of reviews) {
    const rounded = Math.min(5, Math.max(1, Math.round(review.overallRating))) as 1 | 2 | 3 | 4 | 5;
    ratingDistribution[rounded] += 1;
    for (const tag of review.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  const chooseAgainCount = reviews.filter((review) => review.wouldChooseAgain).length;

  return {
    professorId,
    reviewCount: reviews.length,
    overallAverage: average(reviews.map((review) => review.overallRating)),
    pressureAverage: average(reviews.map((review) => review.pressureRating)),
    wouldChooseAgainPercent: Math.round((chooseAgainCount / reviews.length) * 100),
    dimensionAverages: {
      supervision: dimensionAverage((review) => review.supervisionRating),
      communication: dimensionAverage((review) => review.communicationRating),
      autonomy: dimensionAverage((review) => review.autonomyRating),
      labCulture: dimensionAverage((review) => review.labCultureRating),
      researchSupport: dimensionAverage((review) => review.researchSupportRating),
      careerSupport: dimensionAverage((review) => review.careerSupportRating),
    },
    dimensionCounts: {
      supervision: rated((review) => review.supervisionRating).length,
      communication: rated((review) => review.communicationRating).length,
      autonomy: rated((review) => review.autonomyRating).length,
      labCulture: rated((review) => review.labCultureRating).length,
      researchSupport: rated((review) => review.researchSupportRating).length,
      careerSupport: rated((review) => review.careerSupportRating).length,
    },
    ratingDistribution,
    topTags: [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count })),
  };
}
