import type { Metadata } from 'next';
import CommunityModeration from '@/features/community/CommunityModeration';

export const metadata: Metadata = {
  title: 'Community moderation — RunIPS',
  description: 'Private report review queue for authorised RunIPS Community moderators.',
};

export default function CommunityModerationPage() {
  return <CommunityModeration />;
}
