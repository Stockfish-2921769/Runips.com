import { supabase } from '@/lib/supabase';
import {
  CommunityCategory,
  CommunityIndexSnapshot,
  CommunityModerationAction,
  CommunityNotification,
  CommunityNotificationKind,
  CommunityNotificationSnapshot,
  CommunityReply,
  CommunityReplyModerationAction,
  CommunityReport,
  CommunityReportResolutionAction,
  CommunityReportSnapshot,
  CommunityReportTarget,
  CommunitySuggestionSnapshot,
  CommunityTopic,
  CommunityTopicKind,
  CommunityTopicSnapshot,
  CommunityTopicStatus,
  CommunityTopicSummary,
  CreateCommunityTopicDraft,
} from './model';

type UnknownRow = Record<string, unknown>;
type RepositoryError = { code?: string; message?: string } | null;

const MISSING_RESOURCE_CODES = new Set([
  '42P01',
  '42883',
  'PGRST200',
  'PGRST202',
  'PGRST205',
]);

function isMissingCommunityResource(error: RepositoryError): boolean {
  return !!error?.code && MISSING_RESOURCE_CODES.has(error.code);
}

function asRow(value: unknown): UnknownRow {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRow
    : {};
}

function firstValue(row: UnknownRow, keys: string[]): unknown {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return undefined;
}

function stringValue(row: UnknownRow, keys: string[], fallback = ''): string {
  const value = firstValue(row, keys);
  return typeof value === 'string' ? value : fallback;
}

function numberValue(row: UnknownRow, keys: string[], fallback = 0): number {
  const value = firstValue(row, keys);
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nullableNumberValue(row: UnknownRow, keys: string[]): number | null {
  const value = firstValue(row, keys);
  if (value === undefined || value === null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalBooleanValue(row: UnknownRow, keys: string[]): boolean | undefined {
  const value = firstValue(row, keys);
  return typeof value === 'boolean' ? value : undefined;
}

function booleanValue(row: UnknownRow, keys: string[], fallback = false): boolean {
  return optionalBooleanValue(row, keys) ?? fallback;
}

function normaliseKind(value: string): CommunityTopicKind {
  if (value === 'discussion' || value === 'guide') return value;
  return 'question';
}

function normaliseStatus(value: string): CommunityTopicStatus {
  if (value === 'answered') return 'resolved';
  if (value === 'archived') return 'closed';
  if (
    value === 'resolved' ||
    value === 'duplicate' ||
    value === 'closed' ||
    value === 'locked' ||
    value === 'hidden' ||
    value === 'deleted'
  ) return value;
  return 'open';
}

function mapCategory(value: unknown): CommunityCategory {
  const row = asRow(value);
  const slug = stringValue(row, ['slug', 'category_slug', 'id']);
  const sharedName = stringValue(row, ['name', 'label'], slug);
  const sharedDescription = stringValue(row, ['description']);
  return {
    slug,
    nameEn: stringValue(row, ['name_en', 'label_en'], sharedName),
    nameZh: stringValue(row, ['name_zh', 'label_zh'], sharedName),
    descriptionEn: stringValue(row, ['description_en'], sharedDescription),
    descriptionZh: stringValue(row, ['description_zh'], sharedDescription),
    sortOrder: numberValue(row, ['sort_order', 'position']),
  };
}

function mapTopicSummary(value: unknown): CommunityTopicSummary {
  const row = asRow(value);
  const body = stringValue(row, ['body', 'body_markdown', 'content']);
  const excerpt = stringValue(row, ['body_excerpt', 'excerpt'], body.slice(0, 240));
  const categorySlug = stringValue(row, ['category_slug', 'category'], 'other');
  const sharedCategoryName = stringValue(row, ['category_name'], categorySlug);
  const createdAt = stringValue(row, ['created_at'], new Date(0).toISOString());
  const updatedAt = stringValue(row, ['updated_at'], createdAt);

  return {
    id: numberValue(row, ['id', 'topic_id']),
    kind: normaliseKind(stringValue(row, ['kind', 'topic_kind'], 'question')),
    title: stringValue(row, ['title']),
    bodyExcerpt: excerpt,
    categorySlug,
    categoryNameEn: stringValue(row, ['category_name_en', 'category_label_en'], sharedCategoryName),
    categoryNameZh: stringValue(row, ['category_name_zh', 'category_label_zh'], sharedCategoryName),
    status: normaliseStatus(stringValue(row, ['status'], 'open')),
    replyCount: numberValue(row, ['reply_count', 'replies_count']),
    acceptedReplyId: nullableNumberValue(row, ['accepted_reply_id', 'solution_reply_id']),
    duplicateOfTopicId: nullableNumberValue(row, ['duplicate_of_topic_id', 'duplicate_of_id']),
    duplicateOfTitle: stringValue(row, ['duplicate_of_topic_title', 'duplicate_of_title']),
    authorLabel: stringValue(row, ['author_label', 'author_name'], 'Community member'),
    createdAt,
    updatedAt,
    lastActivityAt: stringValue(row, ['last_activity_at'], updatedAt),
    isMine: optionalBooleanValue(row, ['is_mine']),
    canAcceptSolution: optionalBooleanValue(row, ['can_accept_solution']),
    canModerate: optionalBooleanValue(row, ['can_moderate']),
    isSubscribed: optionalBooleanValue(row, ['is_subscribed']),
  };
}

function mapTopic(value: unknown): CommunityTopic {
  const row = asRow(value);
  return {
    ...mapTopicSummary(row),
    body: stringValue(row, ['body', 'body_markdown', 'content']),
  };
}

function mapReply(value: unknown): CommunityReply {
  const row = asRow(value);
  const createdAt = stringValue(row, ['created_at'], new Date(0).toISOString());
  return {
    id: numberValue(row, ['id', 'reply_id']),
    topicId: numberValue(row, ['topic_id']),
    body: stringValue(row, ['body', 'body_markdown', 'content']),
    status: stringValue(row, ['status']) === 'deleted'
      ? 'deleted'
      : stringValue(row, ['status']) === 'hidden'
        ? 'hidden'
        : 'published',
    authorLabel: stringValue(row, ['author_label', 'author_name'], 'Community member'),
    createdAt,
    updatedAt: stringValue(row, ['updated_at'], createdAt),
    isAccepted: booleanValue(row, ['is_accepted', 'accepted']),
    isMine: optionalBooleanValue(row, ['is_mine']),
    isTopicAuthor: optionalBooleanValue(row, ['is_topic_author']),
    canModerate: optionalBooleanValue(row, ['can_moderate']),
  };
}

function normaliseNotificationKind(value: string): CommunityNotificationKind {
  if (value === 'reply' || value === 'new_reply') return 'reply';
  if (value === 'solution' || value === 'solution_accepted' || value === 'accepted_answer') {
    return 'solution';
  }
  if (
    value === 'moderation' ||
    value === 'topic_moderated' ||
    value === 'topic_locked' ||
    value === 'topic_duplicate'
  ) {
    return 'moderation';
  }
  return 'other';
}

function mapNotification(value: unknown): CommunityNotification {
  const row = asRow(value);
  return {
    id: numberValue(row, ['id', 'notification_id']),
    topicId: numberValue(row, ['topic_id']),
    topicTitle: stringValue(row, ['topic_title', 'title']),
    kind: normaliseNotificationKind(stringValue(row, ['event_type', 'kind', 'notification_type', 'type'])),
    excerpt: stringValue(row, ['excerpt', 'message', 'body_excerpt']),
    createdAt: stringValue(row, ['created_at'], new Date(0).toISOString()),
    readAt: stringValue(row, ['read_at']) || null,
  };
}

function mapReport(value: unknown): CommunityReport {
  const row = asRow(value);
  const status = stringValue(row, ['status']);
  return {
    id: numberValue(row, ['id', 'report_id']),
    targetType: stringValue(row, ['target_type']) === 'reply' ? 'reply' : 'topic',
    targetId: numberValue(row, ['target_id']),
    topicId: numberValue(row, ['topic_id']),
    reason: stringValue(row, ['reason']),
    status: status === 'resolved' || status === 'dismissed' ? status : 'open',
    contentTitle: stringValue(row, ['content_title', 'topic_title']),
    contentExcerpt: stringValue(row, ['content_excerpt', 'excerpt']),
    createdAt: stringValue(row, ['created_at'], new Date(0).toISOString()),
    updatedAt: stringValue(row, ['updated_at'], new Date(0).toISOString()),
  };
}

async function selectTopics(): Promise<{ data: unknown[]; error: RepositoryError }> {
  const result = await supabase
    .from('community_topics_public')
    .select('*')
    .neq('status', 'deleted')
    .neq('status', 'hidden')
    .order('last_activity_at', { ascending: false })
    .limit(150);

  return { data: result.data ?? [], error: result.error };
}

export async function getCommunityIndex(): Promise<CommunityIndexSnapshot> {
  const [topicsResult, categoriesResult] = await Promise.all([
    selectTopics(),
    supabase
      .from('community_categories')
      .select('*')
      .order('sort_order', { ascending: true }),
  ]);

  if (topicsResult.error || categoriesResult.error) {
    if (
      isMissingCommunityResource(topicsResult.error) ||
      isMissingCommunityResource(categoriesResult.error)
    ) {
      return { topics: [], categories: [], available: false };
    }
    throw topicsResult.error ?? categoriesResult.error;
  }

  return {
    topics: topicsResult.data
      .map(mapTopicSummary)
      .filter((topic) =>
        topic.id > 0 && topic.title && topic.status !== 'deleted' && topic.status !== 'hidden'),
    categories: (categoriesResult.data ?? [])
      .map(mapCategory)
      .filter((category) => category.slug),
    available: true,
  };
}

export async function getCommunityCategories(): Promise<{
  categories: CommunityCategory[];
  available: boolean;
}> {
  const { data, error } = await supabase
    .from('community_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    if (isMissingCommunityResource(error)) return { categories: [], available: false };
    throw error;
  }

  return {
    categories: (data ?? []).map(mapCategory).filter((category) => category.slug),
    available: true,
  };
}

export async function getCommunityTopic(topicId: number): Promise<CommunityTopicSnapshot> {
  const [topicResult, repliesResult] = await Promise.all([
    supabase
      .from('community_topics_public')
      .select('*')
      .eq('id', topicId)
      .maybeSingle(),
    supabase
      .from('community_replies_public')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true }),
  ]);

  if (topicResult.error || repliesResult.error) {
    if (
      isMissingCommunityResource(topicResult.error) ||
      isMissingCommunityResource(repliesResult.error)
    ) {
      return { topic: null, replies: [], available: false };
    }
    throw topicResult.error ?? repliesResult.error;
  }

  return {
    topic: topicResult.data ? mapTopic(topicResult.data) : null,
    replies: (repliesResult.data ?? [])
      .map(mapReply)
      .filter((reply) => reply.id > 0),
    available: true,
  };
}

export async function suggestCommunityTopics(
  query: string,
  limit = 5,
): Promise<CommunitySuggestionSnapshot> {
  const { data, error } = await supabase.rpc('suggest_community_topics', {
    p_query: query.trim(),
    p_limit: limit,
  });

  if (error) {
    if (isMissingCommunityResource(error)) return { topics: [], available: false };
    throw error;
  }

  return {
    topics: (Array.isArray(data) ? data : [])
      .map(mapTopicSummary)
      .filter((topic) => topic.id > 0 && topic.title),
    available: true,
  };
}

function extractCreatedId(value: unknown): number | null {
  if (Array.isArray(value)) return extractCreatedId(value[0]);
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const row = asRow(value);
  const id = nullableNumberValue(row, ['id', 'topic_id', 'created_topic_id']);
  return id && id > 0 ? id : null;
}

export async function createCommunityTopic(draft: CreateCommunityTopicDraft): Promise<number> {
  const { data, error } = await supabase.rpc('create_community_topic', {
    // The database still requires a kind. User-created entries are uniformly
    // stored as questions so every Topic can use the accepted-reply workflow.
    p_kind: 'question',
    p_title: draft.title.trim(),
    p_body: draft.body.trim(),
    p_category_slug: draft.categorySlug,
  });

  if (error) throw error;
  const topicId = extractCreatedId(data);
  if (!topicId) throw new Error('The created topic ID was not returned');
  return topicId;
}

export async function createCommunityReply(topicId: number, body: string): Promise<void> {
  const { error } = await supabase.rpc('create_community_reply', {
    p_topic_id: topicId,
    p_body: body.trim(),
  });
  if (error) throw error;
}

export async function markCommunitySolution(topicId: number, replyId: number): Promise<void> {
  const { error } = await supabase.rpc('mark_community_solution', {
    p_topic_id: topicId,
    p_reply_id: replyId,
  });
  if (error) throw error;
}

export async function setCommunitySubscription(
  topicId: number,
  subscribed: boolean,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('set_community_subscription', {
    p_topic_id: topicId,
    p_subscribed: subscribed,
  });
  if (error) throw error;
  return typeof data === 'boolean' ? data : subscribed;
}

export async function moderateCommunityTopic(
  topicId: number,
  action: CommunityModerationAction,
  duplicateOfTopicId: number | null = null,
): Promise<void> {
  const { error } = await supabase.rpc('moderate_community_topic', {
    p_topic_id: topicId,
    p_action: action,
    p_duplicate_of_topic_id: duplicateOfTopicId,
  });
  if (error) throw error;
}

export async function moderateCommunityReply(
  replyId: number,
  action: CommunityReplyModerationAction,
): Promise<void> {
  const { error } = await supabase.rpc('moderate_community_reply', {
    p_reply_id: replyId,
    p_action: action,
  });
  if (error) throw error;
}

export async function reportCommunityContent(
  targetType: CommunityReportTarget,
  targetId: number,
  reason = 'community_guidelines',
): Promise<void> {
  const { error } = await supabase.rpc('report_community_content', {
    p_target_type: targetType,
    p_target_id: targetId,
    p_reason: reason,
  });
  if (error) throw error;
}

export async function getCommunityNotifications(): Promise<CommunityNotificationSnapshot> {
  const { data, error } = await supabase.rpc('list_community_notifications');

  if (error) {
    if (isMissingCommunityResource(error)) return { notifications: [], available: false };
    throw error;
  }

  return {
    notifications: (Array.isArray(data) ? data : [])
      .map(mapNotification)
      .filter((notification) => notification.id > 0 && notification.topicId > 0),
    available: true,
  };
}

export async function markCommunityNotificationRead(notificationId: number): Promise<void> {
  const { error } = await supabase.rpc('mark_community_notification_read', {
    p_notification_id: notificationId,
  });
  if (error) throw error;
}

export async function getCommunityReports(): Promise<CommunityReportSnapshot> {
  const { data, error } = await supabase.rpc('list_community_reports', {
    p_status: 'open',
    p_limit: 50,
  });

  if (error) {
    if (error.code === '42501') return { reports: [], available: true, authorised: false };
    if (isMissingCommunityResource(error)) {
      return { reports: [], available: false, authorised: false };
    }
    throw error;
  }

  return {
    reports: (Array.isArray(data) ? data : [])
      .map(mapReport)
      .filter((report) => report.id > 0 && report.topicId > 0),
    available: true,
    authorised: true,
  };
}

export async function resolveCommunityReport(
  reportId: number,
  action: CommunityReportResolutionAction,
): Promise<void> {
  const { error } = await supabase.rpc('resolve_community_report', {
    p_report_id: reportId,
    p_action: action,
  });
  if (error) throw error;
}
