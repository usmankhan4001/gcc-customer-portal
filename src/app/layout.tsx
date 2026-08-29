import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import AppChrome from '@/components/layout/AppChrome';

export const metadata: Metadata = {
  title: 'GCCStartup — Global Company Formation & Tax Optimization',
  description:
    'Form companies in UAE, Hong Kong, Singapore & Bahrain with guaranteed banking, 0% tax structures, and complete nominee privacy.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GCCStartup',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#14204A',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
