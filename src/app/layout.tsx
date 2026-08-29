import type { Metadata } from 'next';
import '@/styles/globals.css';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import Providers from '@/components/layout/Providers';

export const metadata: Metadata = {
  title: 'GCCStartup App — Global Company Formation & Tax Optimization Studio',
  description:
    'Self-serve cross-border tax optimization, company registration in UAE, Hong Kong, Singapore & Bahrain, and ongoing corporate compliance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main className="app-main-content">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
