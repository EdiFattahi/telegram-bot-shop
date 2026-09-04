import { prisma } from '@/lib/prisma'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/order-website`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  const products = await prisma.product.findMany({
    where: {
      status: 'active',
    },
    select: {
      slug: true,
      updatedAt: true,
    },
  })

  const productPages: MetadataRoute.Sitemap = products.map(
    (product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  )

  const posts = await prisma.blogPost.findMany({
    where: {
      published: true,
    },
    select: {
      slug: true,
      updatedAt: true,
    },
  })

  const blogPages: MetadataRoute.Sitemap = posts.map(
    (post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  )

  return [
    ...staticPages,
    ...productPages,
    ...blogPages,
  ]
}