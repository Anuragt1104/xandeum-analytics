import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Header } from '@/components/dashboard/header';
import { Footer } from '@/components/dashboard/footer';
import { SessionProvider } from '@/components/auth/session-provider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Xandeum pNode Analytics | Real-time Network Dashboard',
  description:
    'Real-time analytics dashboard for Xandeum pNodes - the decentralized storage layer for Solana. Monitor network health, node performance, and storage metrics.',
  keywords: [
    'Xandeum',
    'pNode',
    'Solana',
    'blockchain',
    'storage',
    'analytics',
    'decentralized',
    'Web3',
  ],
  authors: [{ name: 'Xandeum Community' }],
  openGraph: {
    title: 'Xandeum pNode Analytics',
    description:
      'Real-time analytics dashboard for Xandeum pNodes - the decentralized storage layer for Solana.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Xandeum pNode Analytics',
    description:
      'Real-time analytics dashboard for Xandeum pNodes - the decentralized storage layer for Solana.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Leaflet CSS for World Map */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <SessionProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
