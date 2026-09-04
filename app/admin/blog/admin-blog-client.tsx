'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
} from 'lucide-react'

interface BlogPost {
  id: string
  slug: string
  title: string
  content: string
  excerpt: string
  coverImage: string | null
  published: boolean
  createdAt: string
  updatedAt: string
}

interface AdminBlogClientProps {
  initialPosts: BlogPost[]
}

interface ApiError {
  error?: string
}

function isApiError(
  value: unknown
): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof value.error === 'string'
  )
}

function isUpdatedBlogPost(
  value: unknown
): value is BlogPost {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false
  }

  const data = value as Record<string, unknown>

  return (
    typeof data.id === 'string' &&
    typeof data.slug === 'string' &&
    typeof data.title === 'string' &&
    typeof data.content === 'string' &&
    typeof data.excerpt === 'string' &&
    (typeof data.coverImage === 'string' ||
      data.coverImage === null) &&
    typeof data.published === 'boolean' &&
    typeof data.createdAt === 'string' &&
    typeof data.updatedAt === 'string'
  )
}

export default function AdminBlogClient({
  initialPosts,
}: AdminBlogClientProps) {
  const [posts, setPosts] =
    useState<BlogPost[]>(initialPosts)

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState('')

  const [deletingId, setDeletingId] =
    useState<string | null>(null)

  const [togglingId, setTogglingId] =
    useState<string | null>(null)

  const loadPosts = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        '/api/admin/blog',
        {
          method: 'GET',
          cache: 'no-store',
        }
      )

      const data: unknown =
        await response.json()

      if (!response.ok) {
        if (isApiError(data)) {
          throw new Error(data.error)
        }

        throw new Error(
          'خطا در دریافت مقالات'
        )
      }

      if (!Array.isArray(data)) {
        throw new Error(
          'ساختار پاسخ مقالات نامعتبر است'
        )
      }

      const validPosts =
        data.filter(isUpdatedBlogPost)

      if (validPosts.length !== data.length) {
        throw new Error(
          'ساختار پاسخ مقالات نامعتبر است'
        )
      }

      setPosts(validPosts)
    } catch (error) {
      console.error(
        'Load blog posts error:',
        error
      )

      setError(
        error instanceof Error
          ? error.message
          : 'خطا در دریافت مقالات'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (
    post: BlogPost
  ) => {
    const confirmed = window.confirm(
      `آیا از حذف مقاله «${post.title}» مطمئن هستید؟`
    )

    if (!confirmed) {
      return
    }

    try {
      setDeletingId(post.id)
      setError('')

      const response = await fetch(
        `/api/admin/blog/${post.id}`,
        {
          method: 'DELETE',
        }
      )

      const data: unknown =
        await response.json()

      if (!response.ok) {
        if (isApiError(data)) {
          throw new Error(data.error)
        }

        throw new Error(
          'خطا در حذف مقاله'
        )
      }

      setPosts((currentPosts) =>
        currentPosts.filter(
          (item) => item.id !== post.id
        )
      )
    } catch (error) {
      console.error(
        'Delete blog post error:',
        error
      )

      setError(
        error instanceof Error
          ? error.message
          : 'خطا در حذف مقاله'
      )
    } finally {
      setDeletingId(null)
    }
  }

  const handleTogglePublished = async (
    post: BlogPost
  ) => {
    try {
      setTogglingId(post.id)
      setError('')

      const response = await fetch(
        `/api/admin/blog/${post.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            title: post.title,
            slug: post.slug,
            content: post.content,
            excerpt: post.excerpt,
            coverImage: post.coverImage,
            published: !post.published,
          }),
        }
      )

      const data: unknown =
        await response.json()

      if (!response.ok) {
        if (isApiError(data)) {
          throw new Error(data.error)
        }

        throw new Error(
          'خطا در تغییر وضعیت انتشار مقاله'
        )
      }

      if (!isUpdatedBlogPost(data)) {
        throw new Error(
          'ساختار پاسخ تغییر وضعیت مقاله نامعتبر است'
        )
      }

      setPosts((currentPosts) =>
        currentPosts.map((item) =>
          item.id === data.id
            ? data
            : item
        )
      )
    } catch (error) {
      console.error(
        'Toggle blog publication error:',
        error
      )

      setError(
        error instanceof Error
          ? error.message
          : 'خطا در تغییر وضعیت انتشار مقاله'
      )
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div
      dir="rtl"
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            مدیریت وبلاگ
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            مدیریت، ایجاد، ویرایش و انتشار مقالات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadPosts()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading
                  ? 'animate-spin'
                  : ''
              }`}
            />

            بروزرسانی
          </button>

          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            <Plus className="h-4 w-4" />

            مقاله جدید
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-xl border bg-card">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />

            در حال دریافت مقالات...
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border bg-card p-8 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>

          <h2 className="text-lg font-semibold">
            هنوز مقاله‌ای وجود ندارد
          </h2>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            برای شروع، اولین مقاله وبلاگ را ایجاد کنید.
          </p>

          <Link
            href="/admin/blog/new"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />

            ایجاد اولین مقاله
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                    عنوان
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                    اسلاگ
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                    وضعیت
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                    تاریخ ایجاد
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                    عملیات
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="max-w-[320px] px-4 py-4">
                      <div className="font-medium">
                        {post.title}
                      </div>

                      <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {post.excerpt}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <code className="rounded bg-muted px-2 py-1 text-xs">
                        {post.slug}
                      </code>
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          void handleTogglePublished(
                            post
                          )
                        }
                        disabled={
                          togglingId === post.id
                        }
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                          post.published
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                        title={
                          post.published
                            ? 'کلیک برای عدم انتشار'
                            : 'کلیک برای انتشار'
                        }
                      >
                        {togglingId ===
                        post.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : post.published ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}

                        {post.published
                          ? 'منتشر شده'
                          : 'پیش‌نویس'}
                      </button>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                      {new Intl.DateTimeFormat(
                        'fa-IR',
                        {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        }
                      ).format(
                        new Date(
                          post.createdAt
                        )
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/blog/${post.id}/edit`}
                          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors hover:bg-muted"
                        >
                          <Pencil className="h-3.5 w-3.5" />

                          ویرایش
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(
                              post
                            )
                          }
                          disabled={
                            deletingId ===
                            post.id
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId ===
                          post.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}

                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}