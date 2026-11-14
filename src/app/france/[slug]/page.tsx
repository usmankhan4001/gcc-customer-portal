import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FranceLanding } from '@/components/france/FranceLanding';
import { PAGES, REVIEW_MODE, findPage } from '@/lib/france/content';

export function generateStaticParams() {
  return PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = findPage(slug);
  if (!page) return {};
  return {
    title: `${page.fr.h1} | GCC Startup`,
    description: page.fr.lede.slice(0, 160),
    robots: REVIEW_MODE ? { index: false, follow: false } : undefined,
  };
}

export default async function FranceFrPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = findPage(slug);
  if (!page) notFound();
  return <FranceLanding page={page} locale="fr" />;
}
