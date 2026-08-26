import type { Metadata } from 'next';
import NewCommunityTopic from '@/features/community/NewCommunityTopic';

export const metadata: Metadata = {
  title: 'New Community topic — RunIPS',
  description: 'Create a topic in the RunIPS Community.',
};

export default function NewCommunityTopicPage() {
  return <NewCommunityTopic />;
}
