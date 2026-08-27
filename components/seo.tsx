import Head from 'next/head'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  type?: string
}

export default function SEO({ 
  title = 'فروشگاه محصولات دیجیتال',
  description = 'ربات سفارش‌گیر تلگرام، اتوماسیون اداری، مشاوره AI و طراحی سایت',
  image = '/images/og-image.jpg',
  type = 'website'
}: SEOProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={`${siteUrl}${image}`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${image}`} />
    </Head>
  )
}