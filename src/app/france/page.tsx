import type { Metadata } from 'next';
import { FranceIndex } from '@/components/france/FranceLanding';
import { REVIEW_MODE } from '@/lib/france/content';

export const metadata: Metadata = {
  title: 'France campaign pages | GCC Startup',
  robots: REVIEW_MODE ? { index: false, follow: false } : undefined,
};

export default function FranceHub() {
  return <FranceIndex />;
}
