import type { Metadata } from 'next';
import PublicAccountProfilePage from '@/features/account/PublicAccountProfilePage';

export const metadata: Metadata = {
  title: 'Community member — RunIPS',
  description: 'A public RunIPS Community member profile.',
};

export default function UserProfilePage() {
  return <PublicAccountProfilePage />;
}
