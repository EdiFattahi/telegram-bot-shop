import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/header'
import Footer from '@/components/footer'
import localFont from 'next/font/local'

const vazir = localFont({
  src: '../Vazir.ttf',
  variable: '--font-vazir',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'فروشگاه محصولات دیجیتال | ربات تلگرام و خدمات AI',
    template: '%s | فروشگاه محصولات دیجیتال',
  },
  description: 'ربات سفارش‌گیر تلگرام، اتوماسیون اداری، مشاوره AI و طراحی سایت با بهترین کیفیت و پشتیبانی ۲۴/۷',
  keywords: ['ربات تلگرام', 'اتوماسیون', 'هوش مصنوعی', 'طراحی سایت', 'فروشگاه دیجیتال', 'ربات سفارش‌گیر'],
  authors: [{ name: 'فروشگاه محصولات دیجیتال' }],
  creator: 'فروشگاه محصولات دیجیتال',
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: 'https://your-domain.com',
    siteName: 'فروشگاه محصولات دیجیتال',
    title: 'فروشگاه محصولات دیجیتال | ربات تلگرام و خدمات AI',
    description: 'ربات سفارش‌گیر تلگرام، اتوماسیون اداری، مشاوره AI و طراحی سایت',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'فروشگاه محصولات دیجیتال',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'فروشگاه محصولات دیجیتال',
    description: 'ربات تلگرام و خدمات AI',
    images: ['/images/og-image.jpg'],
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
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <body className="font-vazir bg-background text-foreground min-h-screen">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}