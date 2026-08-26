import type { Metadata } from 'next';
import CommunityTopicPage from '@/features/community/CommunityTopicPage';

export const metadata: Metadata = {
  title: 'Community topic — RunIPS',
  description: 'A topic from the RunIPS Community.',
};

export default function TopicPage() {
  return <CommunityTopicPage />;
}
