import { PageHeader } from '@/components/admin/PageHeader';

interface BannerHeaderProps {
  title: string;
  subtitle?: string;
}

/**
 * Page title block for every client and tool page: the CMS admin PageHeader, so the portal
 * reads as the same product as the admin. (Kept under its old name so pages did not all change.)
 */
export default function BannerHeader({ title, subtitle }: BannerHeaderProps) {
  return (
    <div className="wrap" style={{ paddingTop: 'var(--space-6)' }}>
      <PageHeader title={title} subtitle={subtitle} />
    </div>
  );
}
