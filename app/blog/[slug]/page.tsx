import type { Metadata } from 'next'

import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  ArrowRight,
  CalendarDays,
  FileText,
} from 'lucide-react'

import { prisma } from '@/lib/prisma'

interface BlogPostPageProps {
  params: Promise<{
    slug: string
  }>
}

interface BlogPost {
  id: string
  slug: string
  title: string
  content: string
  excerpt: string
  coverImage: string | null
  published: boolean
  createdAt: Date
  updatedAt: Date
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  'http://localhost:3000'

function getSiteUrl(): string {
  return SITE_URL.replace(/\/$/, '')
}

function getCanonicalUrl(slug: string): string {
  return `${getSiteUrl()}/blog/${slug}`
}

function isAbsoluteUrl(value: string): boolean {
  try {
    const url = new URL(value)

    return (
      url.protocol === 'http:' ||
      url.protocol === 'https:'
    )
  } catch {
    return false
  }
}

/**
 * Returns an absolute URL.
 *
 * This function is used for SEO metadata,
 * OpenGraph and structured data.
 *
 * It should NOT be used directly as the src
 * of next/image for local uploaded images.
 */
function getImageUrl(
  coverImage: string | null
): string | undefined {
  if (!coverImage) {
    return undefined
  }

  const normalized = coverImage.trim()

  if (!normalized) {
    return undefined
  }

  if (isAbsoluteUrl(normalized)) {
    return normalized
  }

  if (normalized.startsWith('/')) {
    return `${getSiteUrl()}${normalized}`
  }

  return undefined
}

/**
 * Returns the original local path.
 *
 * Example:
 * /uploads/blog/example.jpg
 *
 * This value is passed directly to next/image.
 */
function getLocalImagePath(
  coverImage: string | null
): string | undefined {
  if (!coverImage) {
    return undefined
  }

  const normalized = coverImage.trim()

  if (
    !normalized ||
    !normalized.startsWith('/')
  ) {
    return undefined
  }

  return normalized
}

function formatPersianDate(date: Date): string {
  return new Intl.DateTimeFormat(
    'fa-IR',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  ).format(date)
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params

  const post =
    await prisma.blogPost.findUnique({
      where: {
        slug,
      },
      select: {
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      },
    })

  if (!post) {
    return {
      title: 'مقاله یافت نشد | AI Services',
      description:
        'مقاله مورد نظر پیدا نشد.',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const canonicalUrl =
    getCanonicalUrl(post.slug)

  /*
   * Absolute URL for SEO/OpenGraph.
   */
  const imageUrl =
    getImageUrl(post.coverImage)

  const metadata: Metadata = {
    title: `${post.title} | AI Services`,

    description: post.excerpt,

    alternates: {
      canonical: canonicalUrl,
    },

    robots: post.published
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
          },
        }
      : {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        },

    openGraph: {
      type: 'article',
      locale: 'fa_IR',
      url: canonicalUrl,
      siteName: 'AI Services',
      title: post.title,
      description: post.excerpt,

      publishedTime:
        post.createdAt.toISOString(),

      modifiedTime:
        post.updatedAt.toISOString(),

      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: post.title,
            },
          ]
        : undefined,
    },

    twitter: {
      card: imageUrl
        ? 'summary_large_image'
        : 'summary',

      title: post.title,

      description: post.excerpt,

      images: imageUrl
        ? [imageUrl]
        : undefined,
    },
  }

  return metadata
}

export default async function BlogPostPage({
  params,
}: BlogPostPageProps) {
  const { slug } = await params

  const post: BlogPost | null =
    await prisma.blogPost.findUnique({
      where: {
        slug,
      },
    })

  /*
   * فقط مقالات منتشرشده باید
   * در بخش عمومی وبلاگ قابل مشاهده باشند.
   */
  if (!post || !post.published) {
    notFound()
  }

  const canonicalUrl =
    getCanonicalUrl(post.slug)

  /*
   * Absolute image URL for:
   * - Structured Data
   * - SEO
   * - OpenGraph
   */
  const imageUrl =
    getImageUrl(post.coverImage)

  /*
   * Local image path for next/image.
   *
   * Example:
   * /uploads/blog/example.jpg
   */
  const localImagePath =
    getLocalImagePath(post.coverImage)

  /*
   * URL لوگوی رسمی سایت
   */
  const logoUrl =
    `${getSiteUrl()}/logo.jpg`

  /*
   * Structured Data
   * Schema.org BlogPosting
   */
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',

    headline: post.title,

    description: post.excerpt,

    url: canonicalUrl,

    datePublished:
      post.createdAt.toISOString(),

    dateModified:
      post.updatedAt.toISOString(),

    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },

    author: {
      '@type': 'Organization',
      name: 'AI Services',
      url: getSiteUrl(),
    },

    publisher: {
      '@type': 'Organization',
      name: 'AI Services',
      url: getSiteUrl(),

      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
      },
    },

    ...(imageUrl
      ? {
          image: [imageUrl],
        }
      : {}),
  }

  /*
   * Structured Data
   * Schema.org BreadcrumbList
   */
  const breadcrumbSchema = {
    '@context': 'https://schema.org',

    '@type': 'BreadcrumbList',

    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'خانه',
        item: getSiteUrl(),
      },

      {
        '@type': 'ListItem',
        position: 2,
        name: 'وبلاگ',
        item: `${getSiteUrl()}/blog`,
      },

      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: canonicalUrl,
      },
    ],
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen"
    >
      {/* Breadcrumb */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <nav
            aria-label="مسیر صفحه"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Link
              href="/"
              className="transition-colors hover:text-primary"
            >
              خانه
            </Link>

            <ArrowRight className="h-4 w-4" />

            <Link
              href="/blog"
              className="transition-colors hover:text-primary"
            >
              وبلاگ
            </Link>

            <ArrowRight className="h-4 w-4" />

            <span
              className="truncate text-foreground"
              aria-current="page"
            >
              {post.title}
            </span>
          </nav>
        </div>
      </section>

      {/* Article */}
      <article>
        {/* Article Header */}
        <header className="mx-auto max-w-4xl px-6 pb-10 pt-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />

            <time
              dateTime={post.createdAt.toISOString()}
            >
              {formatPersianDate(
                post.createdAt
              )}
            </time>
          </div>

          <h1 className="mt-5 text-3xl font-bold leading-[1.8] tracking-tight sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          <p className="mt-6 text-base leading-8 text-muted-foreground sm:text-lg">
            {post.excerpt}
          </p>
        </header>

        {/* Cover Image */}
        {post.coverImage ? (
          <div className="mx-auto max-w-5xl px-6">
            <div className="overflow-hidden rounded-2xl border bg-muted shadow-sm">
              <div className="relative aspect-video w-full">
                {localImagePath ? (
                  <Image
                    src={localImagePath}
                    alt={post.title}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 1024px"
                    className="object-cover"
                  />
                ) : imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={post.title}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 1024px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <FileText className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl px-6">
            <div className="flex aspect-video items-center justify-center rounded-2xl border bg-muted">
              <FileText className="h-16 w-16 text-muted-foreground" />
            </div>
          </div>
        )}

        {/* Article Content */}
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div
            className="
              prose
              prose-lg
              max-w-none
              dark:prose-invert
              prose-headings:font-bold
              prose-headings:leading-[1.8]
              prose-p:leading-9
              prose-li:leading-8
              prose-a:text-primary
              prose-a:no-underline
              hover:prose-a:underline
            "
          >
            {post.content
              .split('\n')
              .map((paragraph, index) => {
                const text =
                  paragraph.trim()

                if (!text) {
                  return null
                }

                return (
                  <p key={index}>
                    {text}
                  </p>
                )
              })}
          </div>
        </div>
      </article>

      {/* Back to Blog */}
      <section className="border-t">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <ArrowRight className="h-4 w-4" />

            بازگشت به وبلاگ
          </Link>
        </div>
      </section>

      {/* Article Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              articleSchema
            ),
        }}
      />

      {/* Breadcrumb Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              breadcrumbSchema
            ),
        }}
      />
    </main>
  )
}
