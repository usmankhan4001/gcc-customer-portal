import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import '@/styles/tokens.css';
import '@/styles/components.css';
import '@/styles/globals.css';
import Providers from '@/components/layout/Providers';

const satoshi = localFont({
  variable: '--font-satoshi',
  display: 'swap',
  src: [
    { path: '../../public/fonts/Satoshi-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/Satoshi-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/Satoshi-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../../public/fonts/Satoshi-Black.woff2', weight: '900', style: 'normal' },
  ],
});

const clash = localFont({
  variable: '--font-clash',
  display: 'swap',
  src: [
    { path: '../../public/fonts/ClashDisplay-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/ClashDisplay-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/ClashDisplay-Semibold.woff2', weight: '600', style: 'normal' },
    { path: '../../public/fonts/ClashDisplay-Bold.woff2', weight: '700', style: 'normal' },
  ],
});

export const metadata: Metadata = {
  title: 'GCCStartup — Global Incorporation & Operations',
  description:
    'Form companies in UAE, Hong Kong, Singapore, Bahrain & more with guaranteed corporate banking, 0% tax structures, and complete nominee privacy.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GCCStartup',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#14204A',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${satoshi.variable} ${clash.variable}`} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-sans antialiased text-[#0F172A] bg-[#FFFFFF] min-h-screen" suppressHydrationWarning>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
