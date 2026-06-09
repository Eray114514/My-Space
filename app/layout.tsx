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
    template: '%s | Eray',
    default: 'Eray - 高级个人博客',
  },
  description: 'Eray 的个人博客，记录文章、想法与技术实践。',
  keywords: ['个人博客', '技术博客', '文章', '思考', '前端开发', '设计'],
  openGraph: {
    title: 'Eray - 高级个人博客',
    description: 'Eray 的个人博客，记录文章、想法与技术实践。',
    type: 'website',
    locale: 'zh_CN',
    siteName: 'Eray',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eray - 高级个人博客',
    description: 'Eray 的个人博客，记录文章、想法与技术实践。',
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="28" fill="%23070707"/><text x="50" y="64" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" font-weight="800" fill="white">E</text></svg>',
    shortcut: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="28" fill="%23070707"/><text x="50" y="64" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" font-weight="800" fill="white">E</text></svg>',
    apple: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="28" fill="%23070707"/><text x="50" y="64" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" font-weight="800" fill="white">E</text></svg>',
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
