import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './liquid-glass.css';
import './markdown.css';
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
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" integrity="sha384-n8MVd4RsEw098lKa53KkMv4hO0E1mQ7tE/l6g9Z0S//P/Y9wB/oR5lZ/oH/Qp1n/" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <ClientLayout>
          {children}
        </ClientLayout>
        <Toaster 
          toastOptions={{
            className: 'dark:bg-[#1a1a1a] dark:text-gray-100 dark:border dark:border-white/10 shadow-lg',
          }}
        />
      </body>
    </html>
  );
}
