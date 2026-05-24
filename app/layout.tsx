import type { Metadata, Viewport } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Papaw — Bedtime Companion',
  description:
    'Papaw is a warm AI bedtime companion for kids — telling stories, exploring the world, and delivering Papa\'s love through conversations.',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f1129',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${nunito.variable} h-full`}>
      <body className="min-h-dvh font-sans antialiased bg-papaw-bg text-text-primary">
        {children}
      </body>
    </html>
  );
}
