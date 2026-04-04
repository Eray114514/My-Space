import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientLayout } from './ClientLayout';
import { Toaster } from 'react-hot-toast';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'My Digital Garden',
  description: 'Welcome to my digital garden, where I share my thoughts, code, and design.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <Suspense fallback={<div>Loading...</div>}>
          <ClientLayout>
            {children}
          </ClientLayout>
        </Suspense>
        <Toaster 
          toastOptions={{
            className: 'dark:bg-[#1a1a1a] dark:text-gray-100 dark:border dark:border-white/10 shadow-lg',
          }}
        />
      </body>
    </html>
  );
}
