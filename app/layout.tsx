import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { Header } from '@/components/dashboard/header';
import { Footer } from '@/components/dashboard/footer';
import { SessionProvider } from '@/components/auth/session-provider';
import './globals.css';

// Premium font combination
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space',
  subsets: ['latin'],
  display: 'swap',
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
    icon: [
      { url: '/xandeum-x.png', type: 'image/png' },
    ],
    apple: '/xandeum-x.png',
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
        className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} antialiased min-h-screen flex flex-col`}
      >
        {/* Animated background */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/3 to-transparent rounded-full" />
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>
        
        <SessionProvider>
          <Header />
          <main className="flex-1 relative">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
