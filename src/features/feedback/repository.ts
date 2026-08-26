import { Lang } from '@/i18n/translations';
import { supabase } from '@/lib/supabase';

export const FEEDBACK_CATEGORIES = ['general', 'bug', 'privacy', 'content', 'other'] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export interface FeedbackDraft {
  category: FeedbackCategory;
  message: string;
  replyContact: string;
  pageUrl: string;
  website: string;
}

export async function submitFeedback(draft: FeedbackDraft, lang: Lang): Promise<string> {
  const { data, error } = await supabase.rpc('submit_feedback', {
    p_category: draft.category,
    p_message: draft.message.trim(),
    p_reply_contact: draft.replyContact.trim() || null,
    p_page_url: draft.pageUrl.trim() || null,
    p_locale: lang,
    p_website: draft.website,
  });

  if (error) throw error;
  if (typeof data !== 'string' || data.length === 0) {
    throw new Error('Feedback reference was not returned');
  }
  return data;
}
