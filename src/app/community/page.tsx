import type { Metadata } from 'next';
import CommunityIndex from '@/features/community/CommunityIndex';

export const metadata: Metadata = {
  title: 'Community — RunIPS',
  description: 'Durable topics for the Waseda IPS community.',
};

export default function CommunityPage() {
  return <CommunityIndex />;
}
