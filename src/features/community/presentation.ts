import { Lang } from '@/i18n/translations';
import { CommunityCategory, CommunityTopicSummary } from './model';

export function communityCategoryName(
  category: CommunityCategory | CommunityTopicSummary,
  lang: Lang,
): string {
  if ('nameEn' in category) {
    return lang === 'zh' ? category.nameZh : category.nameEn;
  }
  return lang === 'zh' ? category.categoryNameZh : category.categoryNameEn;
}

export function formatCommunityDate(value: string, lang: Lang): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

const AUTHOR_LABELS_ZH: Record<string, string> = {
  You: '你',
  'Community member': '社区成员',
  'Deleted member': '已删除账号',
  'RunIPS team': 'RunIPS 团队',
  'RunIPS Community Archive': 'RunIPS 社区资料库',
};

export function communityAuthorLabel(value: string, lang: Lang, isMine = false): string {
  if (isMine) return lang === 'zh' ? '你' : 'You';
  return lang === 'zh' ? AUTHOR_LABELS_ZH[value] ?? value : value;
}

export function normaliseCommunitySearch(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}
