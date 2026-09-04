'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowRight,
  Mail,
  Trash2,
  User,
  Calendar,
  FileText,
  Loader2,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ContactStatus = 'new' | 'read' | 'replied' | 'archived'

type ContactMessage = {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: ContactStatus
  createdAt: string
  updatedAt: string
}

const STATUS_LABELS: Record<ContactStatus, string> = {
  new: 'جدید',
  read: 'خوانده شده',
  replied: 'پاسخ داده شده',
  archived: 'بایگانی شده',
}

const STATUS_CLASSES: Record<ContactStatus, string> = {
  new: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  read: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  replied: 'bg-green-500/20 text-green-300 border-green-500/30',
  archived: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function AdminContactDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const id = params?.id

  const [message, setMessage] = useState<ContactMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadMessage = useCallback(async () => {
    if (!id) {
      setError('شناسه پیام نامعتبر است')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/admin/contact/${encodeURIComponent(id)}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }

        throw new Error(
          data?.error || 'خطا در دریافت پیام'
        )
      }

      setMessage(data)
    } catch (err) {
      console.error('Load contact message error:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'خطا در دریافت پیام'
      )
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMessage()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadMessage])

  const handleStatusChange = async (
    newStatus: ContactStatus
  ) => {
    if (!message || updating || deleting) {
      return
    }

    try {
      setUpdating(true)
      setError('')
      setSuccess('')

      const response = await fetch(
        `/api/admin/contact/${encodeURIComponent(message.id)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }

        throw new Error(
          data?.error || 'خطا در بروزرسانی وضعیت پیام'
        )
      }

      setMessage(data)
      setSuccess('وضعیت پیام با موفقیت بروزرسانی شد')

      window.setTimeout(() => {
        setSuccess('')
      }, 3000)
    } catch (err) {
      console.error('Update contact status error:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'خطا در بروزرسانی وضعیت پیام'
      )
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!message || updating || deleting) {
      return
    }

    const confirmed = window.confirm(
      'آیا از حذف این پیام اطمینان دارید؟ این عملیات قابل بازگشت نیست.'
    )

    if (!confirmed) {
      return
    }

    try {
      setDeleting(true)
      setError('')

      const response = await fetch(
        `/api/admin/contact/${encodeURIComponent(message.id)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }

        throw new Error(
          data?.error || 'خطا در حذف پیام'
        )
      }

      router.push('/admin/contact')
    } catch (err) {
      console.error('Delete contact message error:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'خطا در حذف پیام'
      )

      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-5xl mx-auto flex min-h-[60vh] items-center justify-center">
          <div className="flex items-center gap-3 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>در حال دریافت پیام...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error && !message) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-5xl mx-auto">
          <Card className="glass-card border-0">
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                <MessageSquare className="h-8 w-8 text-red-400" />
              </div>

              <h1 className="mb-3 text-xl font-bold text-white">
                خطا در دریافت پیام
              </h1>

              <p className="mb-6 text-gray-400">
                {error}
              </p>

              <div className="flex justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void loadMessage()}
                >
                  تلاش مجدد
                </Button>

                <Button asChild>
                  <Link href="/admin/contact">
                    بازگشت به پیام‌ها
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!message) {
    return null
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2">
              <Link
                href="/admin/contact"
                className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
              >
                <ArrowRight className="h-4 w-4" />
                بازگشت به پیام‌ها
              </Link>
            </div>

            <h1 className="text-3xl font-bold text-white">
              جزئیات پیام
            </h1>

            <p className="mt-1 text-sm text-gray-400">
              مشاهده و مدیریت پیام تماس
            </p>
          </div>

          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={deleting || updating}
          >
            {deleting ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="ml-2 h-4 w-4" />
            )}
            {deleting ? 'در حال حذف...' : 'حذف پیام'}
          </Button>
        </div>

        {/* Feedback */}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300"
          >
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sender information */}
          <Card className="glass-card border-0 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-white">
                اطلاعات فرستنده
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="flex items-start gap-3">
                <User className="mt-1 h-5 w-5 shrink-0 text-blue-400" />

                <div className="min-w-0">
                  <p className="text-xs text-gray-500">
                    نام
                  </p>
                  <p className="mt-1 break-words font-medium text-white">
                    {message.name}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-1 h-5 w-5 shrink-0 text-blue-400" />

                <div className="min-w-0">
                  <p className="text-xs text-gray-500">
                    ایمیل
                  </p>

                  <a
                    href={`mailto:${message.email}`}
                    className="mt-1 block break-all text-blue-300 transition-colors hover:text-blue-200"
                  >
                    {message.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="mt-1 h-5 w-5 shrink-0 text-blue-400" />

                <div>
                  <p className="text-xs text-gray-500">
                    تاریخ ارسال
                  </p>

                  <p className="mt-1 text-sm text-gray-300">
                    {formatDate(message.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="mt-1 h-5 w-5 shrink-0 text-blue-400" />

                <div>
                  <p className="text-xs text-gray-500">
                    آخرین بروزرسانی
                  </p>

                  <p className="mt-1 text-sm text-gray-300">
                    {formatDate(message.updatedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message */}
          <Card className="glass-card border-0 lg:col-span-2">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="mb-1 text-xs text-gray-500">
                    موضوع
                  </p>

                  <CardTitle className="break-words text-xl text-white">
                    {message.subject}
                  </CardTitle>
                </div>

                <span
                  className={`inline-flex w-fit shrink-0 items-center rounded-full border px-3 py-1 text-xs font-medium ${STATUS_CLASSES[message.status]}`}
                >
                  {STATUS_LABELS[message.status]}
                </span>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <p className="whitespace-pre-wrap break-words text-sm leading-8 text-gray-300">
                  {message.message}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status management */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="text-white">
              مدیریت وضعیت
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(Object.keys(STATUS_LABELS) as ContactStatus[]).map(
                (status) => {
                  const isActive = message.status === status

                  return (
                    <Button
                      key={status}
                      type="button"
                      variant={isActive ? 'default' : 'outline'}
                      disabled={
                        updating ||
                        deleting ||
                        isActive
                      }
                      onClick={() =>
                        void handleStatusChange(status)
                      }
                      className="h-11"
                    >
                      {updating && isActive ? (
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      ) : null}

                      {STATUS_LABELS[status]}
                    </Button>
                  )
                }
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}