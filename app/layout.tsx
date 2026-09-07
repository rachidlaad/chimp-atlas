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
  title: 'PRIMAL — Built Different. The Chimp Anatomy Lab.',
  description:
    'The internet picked a fight. Meet the anatomy: explore chimpanzee muscles in 3D and the research behind the MMA-versus-chimp debate.',
  openGraph: {
    title: 'Confidence isn’t a muscle group. | PRIMAL',
    description: 'Explore chimp muscles in 3D. Real anatomy. Actual papers.',
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
