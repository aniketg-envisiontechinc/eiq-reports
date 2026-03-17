import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EngageIQ Reports',
  description: 'Post Webinar Analytics & Reports',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={null}>
          <Sidebar />
        </Suspense>
        <div className="ml-56 min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  );
}
