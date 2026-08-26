export const REVIEW_DIMENSION_KEYS = [
  'supervision',
  'communication',
  'autonomy',
  'labCulture',
  'researchSupport',
  'careerSupport',
] as const;

export type ReviewDimensionKey = (typeof REVIEW_DIMENSION_KEYS)[number];

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
  supervisionRating: number;
  communicationRating: number;
  autonomyRating: number;
  labCultureRating: number;
  researchSupportRating: number;
  careerSupportRating: number;
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
  supervisionRating: number;
  communicationRating: number;
  autonomyRating: number;
  labCultureRating: number;
  researchSupportRating: number;
  careerSupportRating: number;
  wouldChooseAgain: boolean | null;
  studentLevel: StudentLevel | null | '';
  relationshipStatus: RelationshipStatus | null | '';
  communicationLanguage: CommunicationLanguage | null | '';
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
  studentLevel: '',
  relationshipStatus: '',
  communicationLanguage: '',
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
      supervision: average(reviews.map((review) => review.supervisionRating)),
      communication: average(reviews.map((review) => review.communicationRating)),
      autonomy: average(reviews.map((review) => review.autonomyRating)),
      labCulture: average(reviews.map((review) => review.labCultureRating)),
      researchSupport: average(reviews.map((review) => review.researchSupportRating)),
      careerSupport: average(reviews.map((review) => review.careerSupportRating)),
    },
    ratingDistribution,
    topTags: [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count })),
  };
}
