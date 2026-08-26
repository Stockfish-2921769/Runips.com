import { PROFESSOR_EN } from '@/data/professorNames';

export function getGoogleScholarSearchUrl(professorId: number, fallbackName: string): string {
  const englishName = PROFESSOR_EN[professorId]?.nameEn || fallbackName;
  const query = `author:"${englishName}" Waseda`;
  return `https://scholar.google.com/scholar?hl=en&q=${encodeURIComponent(query)}`;
}
