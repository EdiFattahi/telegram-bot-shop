import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { FileText, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  'http://localhost:3000'

export const metadata: Metadata = {
  title: 'وبلاگ | AI Services',
  description:
    'مقالات، آموزش‌ها و مطالب تخصصی درباره هوش مصنوعی، اتوماسیون، ربات‌های تلگرام و توسعه نرم‌افزار.',
  keywords: [
    'هوش مصنوعی',
    'اتوماسیون',
    'ربات تلگرام',
    'توسعه نرم افزار',
    'برنامه نویسی',
    'AI Services',
    'وبلاگ هوش مصنوعی',
  ],
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: `${SITE_URL}/blog`,
    title: 'وبلاگ | AI Services',
    description:
      'مقالات، آموزش‌ها و مطالب تخصصی درباره هوش مصنوعی، اتوماسیون، ربات‌های تلگرام و توسعه نرم‌افزار.',
    siteName: 'AI Services',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'وبلاگ | AI Services',
    description:
      'مقالات، آموزش‌ها و مطالب تخصصی درباره هوش مصنوعی، اتوماسیون، ربات‌های تلگرام و توسعه نرم‌افزار.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: {
      published: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      createdAt: true,
    },
  })

    const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'وبلاگ AI Services',
    description:
      'مقالات، آموزش‌ها و مطالب تخصصی درباره هوش مصنوعی، اتوماسیون، ربات‌های تلگرام و توسعه نرم‌افزار.',
    url: `${SITE_URL}/blog`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'AI Services',
      url: SITE_URL,
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: posts.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/blog/${post.slug}`,
        name: post.title,
      })),
    },
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen"
    >
      {/* Hero */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <FileText className="h-7 w-7 text-primary" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              وبلاگ AI Services
            </h1>

            <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
              مقالات، آموزش‌ها و مطالب تخصصی درباره
              هوش مصنوعی، اتوماسیون، ربات‌های تلگرام
              و توسعه نرم‌افزار
            </p>
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        {posts.length === 0 ? (
          <div className="rounded-2xl border bg-card p-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />

            <h2 className="mt-4 text-xl font-semibold">
              هنوز مقاله‌ای منتشر نشده است
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              به‌زودی مطالب جدیدی در وبلاگ منتشر خواهد شد.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-lg"
              >
                {/* Cover */}
                {post.coverImage ? (
                  <Link
                    href={`/blog/${post.slug}`}
                    className="block overflow-hidden"
                  >
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      width={1200}
                      height={675}
                      className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </Link>
                ) : (
                  <Link
                    href={`/blog/${post.slug}`}
                    className="flex aspect-video items-center justify-center bg-muted"
                  >
                    <FileText className="h-10 w-10 text-muted-foreground" />
                  </Link>
                )}

                {/* Content */}
                <div className="p-5">
                  <div className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat(
                      'fa-IR',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    ).format(
                      new Date(post.createdAt)
                    )}
                  </div>

                  <h2 className="mt-3 line-clamp-2 text-lg font-bold leading-8">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="transition-colors hover:text-primary"
                    >
                      {post.title}
                    </Link>
                  </h2>

                  <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">
                    {post.excerpt}
                  </p>

                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary"
                  >
                    مطالعه مقاله

                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogSchema),
        }}
      />
    </main>
  )
}
