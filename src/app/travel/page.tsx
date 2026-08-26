import type { Metadata } from 'next';
import TravelGuide from '@/features/travel-guide/TravelGuide';

export const metadata: Metadata = {
  title: 'Travel Guide | RunIPS',
  description: 'Plan airline routes to Fukuoka or Kitakyushu and screen transfer conditions before travelling to Waseda IPS.',
};

export default function TravelPage() {
  return <TravelGuide />;
}
