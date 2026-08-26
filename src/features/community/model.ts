// `kind` remains an internal persistence detail for imported guides and legacy rows.
// The public Community experience treats every user-created entry as a Topic.
export type CommunityTopicKind = 'question' | 'discussion' | 'guide';
export type CommunityTopicStatus = 'open' | 'resolved' | 'duplicate' | 'closed' | 'locked' | 'hidden' | 'deleted';
export type CommunityReplyStatus = 'published' | 'hidden' | 'deleted';
export type CommunityFilter = 'latest' | 'open' | 'resolved';
export type CommunityReportTarget = 'topic' | 'reply';
export type CommunityModerationAction = 'duplicate' | 'lock' | 'close' | 'reopen';
export type CommunityReplyModerationAction = 'hide' | 'restore';
export type CommunityReportResolutionAction = 'hide' | 'dismiss';

export const COMMUNITY_LIMITS = {
  title: 160,
  body: 10_000,
  reply: 10_000,
} as const;

export interface CommunityCategory {
  slug: string;
  nameEn: string;
  nameZh: string;
  descriptionEn: string;
  descriptionZh: string;
  sortOrder: number;
}

export interface CommunityTopicSummary {
  id: number;
  kind: CommunityTopicKind;
  title: string;
  bodyExcerpt: string;
  categorySlug: string;
  categoryNameEn: string;
  categoryNameZh: string;
  status: CommunityTopicStatus;
  replyCount: number;
  acceptedReplyId: number | null;
  duplicateOfTopicId: number | null;
  duplicateOfTitle: string;
  authorLabel: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  isMine?: boolean;
  canAcceptSolution?: boolean;
  canModerate?: boolean;
  isSubscribed?: boolean;
}

export interface CommunityTopic extends CommunityTopicSummary {
  body: string;
}

export interface CommunityReply {
  id: number;
  topicId: number;
  body: string;
  status: CommunityReplyStatus;
  authorLabel: string;
  createdAt: string;
  updatedAt: string;
  isAccepted: boolean;
  isMine?: boolean;
  isTopicAuthor?: boolean;
  canModerate?: boolean;
}

export interface CommunityTopicSnapshot {
  topic: CommunityTopic | null;
  replies: CommunityReply[];
  available: boolean;
}

export interface CommunityIndexSnapshot {
  topics: CommunityTopicSummary[];
  categories: CommunityCategory[];
  available: boolean;
}

export interface CommunitySuggestionSnapshot {
  topics: CommunityTopicSummary[];
  available: boolean;
}

export type CommunityNotificationKind = 'reply' | 'solution' | 'moderation' | 'other';

export interface CommunityNotification {
  id: number;
  topicId: number;
  topicTitle: string;
  kind: CommunityNotificationKind;
  excerpt: string;
  createdAt: string;
  readAt: string | null;
}

export interface CommunityNotificationSnapshot {
  notifications: CommunityNotification[];
  available: boolean;
}

export interface CommunityReport {
  id: number;
  targetType: CommunityReportTarget;
  targetId: number;
  topicId: number;
  reason: string;
  status: 'open' | 'resolved' | 'dismissed';
  contentTitle: string;
  contentExcerpt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityReportSnapshot {
  reports: CommunityReport[];
  available: boolean;
  authorised: boolean;
}

export interface CreateCommunityTopicDraft {
  title: string;
  body: string;
  categorySlug: string;
}

export function communityTopicHref(topicId: number): string {
  return `/community/t/?id=${encodeURIComponent(String(topicId))}`;
}

export function isTopicClosed(status: CommunityTopicStatus): boolean {
  return status === 'duplicate' || status === 'closed' || status === 'locked' || status === 'hidden' || status === 'deleted';
}
