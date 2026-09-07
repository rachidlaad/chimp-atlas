import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
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
  metadataBase: new URL(
    'https://built-different-chimp-lab.xracheed.chatgpt.site',
  ),
  alternates: { canonical: '/' },
  title: 'Chimp Atlas — 3D Anatomy Explorer',
  description:
    'Explore chimpanzee bones and regional muscle anatomy in 3D. Rotate and zoom through the skeleton, head and neck, and lower limb.',
  openGraph: {
    title: 'Chimp Atlas — 3D Anatomy Explorer',
    description: 'A closer look at chimpanzee bones and muscles.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
