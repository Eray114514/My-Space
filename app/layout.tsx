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
  metadataBase: new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  title: {
    template: '%s | My Digital Garden',
    default: 'My Digital Garden - 个人数字花园',
  },
  description: '这里是我的数字花园。在液态流动的光影中，分享设计、代码与思考。',
  keywords: ['个人博客', '数字花园', '代码', '设计', '技术分享', '前端开发'],
  openGraph: {
    title: 'My Digital Garden - 个人数字花园',
    description: '这里是我的数字花园。在液态流动的光影中，分享设计、代码与思考。',
    type: 'website',
    locale: 'zh_CN',
    siteName: 'My Digital Garden',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Digital Garden - 个人数字花园',
    description: '这里是我的数字花园。在液态流动的光影中，分享设计、代码与思考。',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
