import { prisma } from '@/lib/prisma'
import AdminBlogClient from './admin-blog-client'

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })

  const serializedPosts = posts.map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    published: post.published,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }))

  return <AdminBlogClient initialPosts={serializedPosts} />
}