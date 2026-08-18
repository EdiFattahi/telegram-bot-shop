import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

export const metadata: Metadata = {
  title: 'ربات سفارشگیر تلگرام',
  description: 'مدیریت خودکار سفارشات تلگرام',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-background text-foreground">{children}</body>
    </html>
  );
}