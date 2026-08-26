import type { Metadata } from 'next';
import CommunityNotifications from '@/features/community/CommunityNotifications';

export const metadata: Metadata = {
  title: 'Community notifications — RunIPS',
  description: 'Replies and updates for your RunIPS Community topics.',
};

export default function NotificationsPage() {
  return <CommunityNotifications />;
}
