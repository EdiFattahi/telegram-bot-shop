'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'   
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2,
  Eye,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  Trash2,
  User,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

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

type StatusFilter = 'all' | ContactStatus

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

export default function AdminContactPage() {
    const router = useRouter()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('all')

  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadMessages = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')

      const response = await fetch('/api/admin/contact', {
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
          data?.error || 'خطا در دریافت پیام‌ها'
        )
      }

      if (!Array.isArray(data)) {
        throw new Error('پاسخ نامعتبر از سرور دریافت شد')
      }

      setMessages(data)
    } catch (err) {
      console.error('Load admin contact messages error:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'خطا در دریافت پیام‌ها'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMessages()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadMessages])

  const filteredMessages = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return messages.filter((item) => {
      const matchesStatus =
        statusFilter === 'all' ||
        item.status === statusFilter

      if (!matchesStatus) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return (
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.email.toLowerCase().includes(normalizedSearch) ||
        item.subject.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [messages, search, statusFilter])

  const newCount = useMemo(
    () =>
      messages.filter(
        (item) => item.status === 'new'
      ).length,
    [messages]
  )

  const handleStatusChange = async (
    id: string,
    status: ContactStatus
  ) => {
    if (updatingId || deletingId) {
      return
    }

    try {
      setUpdatingId(id)
      setError('')
      setSuccess('')

      const response = await fetch(
        `/api/admin/contact/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ status }),
        }
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }

        throw new Error(
          data?.error ||
            'خطا در بروزرسانی وضعیت پیام'
        )
      }

      setMessages((current) =>
        current.map((item) =>
          item.id === id ? data : item
        )
      )

      setSuccess('وضعیت پیام بروزرسانی شد')

      window.setTimeout(() => {
        setSuccess('')
      }, 2500)
    } catch (err) {
      console.error(
        'Update contact status error:',
        err
      )

      setError(
        err instanceof Error
          ? err.message
          : 'خطا در بروزرسانی وضعیت پیام'
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (message: ContactMessage) => {
    if (updatingId || deletingId) {
      return
    }

    const confirmed = window.confirm(
      `آیا از حذف پیام «${message.subject}» اطمینان دارید؟\n\nاین عملیات قابل بازگشت نیست.`
    )

    if (!confirmed) {
      return
    }

    try {
      setDeletingId(message.id)
      setError('')
      setSuccess('')

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

      setMessages((current) =>
        current.filter(
          (item) => item.id !== message.id
        )
      )

      setSuccess('پیام با موفقیت حذف شد')

      window.setTimeout(() => {
        setSuccess('')
      }, 2500)
    } catch (err) {
      console.error(
        'Delete contact message error:',
        err
      )

      setError(
        err instanceof Error
          ? err.message
          : 'خطا در حذف پیام'
      )
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center">
          <div className="flex items-center gap-3 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>در حال دریافت پیام‌ها...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              پیام‌های تماس
            </h1>

            <p className="mt-1 text-sm text-gray-400">
              مدیریت پیام‌های ارسال‌شده از فرم تماس
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => void loadMessages(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="ml-2 h-4 w-4" />
            )}

            {refreshing ? 'در حال بروزرسانی...' : 'بروزرسانی'}
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="glass-card border-0">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
                <Inbox className="h-6 w-6 text-blue-400" />
              </div>

              <div>
                <p className="text-sm text-gray-400">
                  کل پیام‌ها
                </p>

                <p className="text-2xl font-bold text-white">
                  {messages.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/20">
                <MessageSquare className="h-6 w-6 text-yellow-400" />
              </div>

              <div>
                <p className="text-sm text-gray-400">
                  پیام‌های جدید
                </p>

                <p className="text-2xl font-bold text-white">
                  {newCount}
                </p>
              </div>
            </CardContent>
          </Card>
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

        {/* Filters */}
        <Card className="glass-card border-0">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="جستجو بر اساس نام، ایمیل یا موضوع..."
                  className="bg-white/10 border-white/20 pr-10 text-white placeholder:text-gray-500"
                />
              </div>

              {/* Status filters */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={
                    statusFilter === 'all'
                      ? 'default'
                      : 'outline'
                  }
                  onClick={() => setStatusFilter('all')}
                >
                  همه
                </Button>

                {(Object.keys(STATUS_LABELS) as ContactStatus[]).map(
                  (status) => (
                    <Button
                      key={status}
                      type="button"
                      variant={
                        statusFilter === status
                          ? 'default'
                          : 'outline'
                      }
                      onClick={() =>
                        setStatusFilter(status)
                      }
                    >
                      {STATUS_LABELS[status]}
                    </Button>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty state */}
        {filteredMessages.length === 0 && (
          <Card className="glass-card border-0">
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                <MessageSquare className="h-8 w-8 text-gray-500" />
              </div>

              <h2 className="text-lg font-semibold text-white">
                {messages.length === 0
                  ? 'هنوز پیامی دریافت نشده است'
                  : 'پیامی با این فیلتر پیدا نشد'}
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                {messages.length === 0
                  ? 'پیام‌های فرم تماس در اینجا نمایش داده می‌شوند.'
                  : 'فیلتر یا عبارت جستجو را تغییر دهید.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        {filteredMessages.length > 0 && (
          <div className="space-y-4">
            {filteredMessages.map((message) => {
              const isUpdating =
                updatingId === message.id

              const isDeleting =
                deletingId === message.id

              return (
                <Card
                  key={message.id}
                  className={`glass-card border-0 transition ${
                    message.status === 'new'
                      ? 'ring-1 ring-blue-500/20'
                      : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="break-words text-lg text-white">
                            {message.subject}
                          </CardTitle>

                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[message.status]}`}
                          >
                            {STATUS_LABELS[message.status]}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-col gap-2 text-sm text-gray-400 sm:flex-row sm:flex-wrap sm:gap-4">
                          <span className="inline-flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {message.name}
                          </span>

                          <span className="inline-flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {message.email}
                          </span>

                          <span>
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                        >
                          <Link
                            href={`/admin/contact/${encodeURIComponent(
                              message.id
                            )}`}
                          >
                            <Eye className="ml-2 h-4 w-4" />
                            مشاهده
                          </Link>
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            void handleDelete(message)
                          }
                          disabled={
                            isUpdating ||
                            isDeleting
                          }
                        >
                          {isDeleting ? (
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="ml-2 h-4 w-4" />
                          )}

                          حذف
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm leading-7 text-gray-400">
                      {message.message}
                    </p>

                    <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-xs text-gray-500">
                        شناسه: {message.id}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(STATUS_LABELS) as ContactStatus[]).map(
                          (status) => (
                            <Button
                              key={status}
                              type="button"
                              size="sm"
                              variant={
                                message.status === status
                                  ? 'default'
                                  : 'outline'
                              }
                              disabled={
                                isUpdating ||
                                isDeleting ||
                                message.status === status
                              }
                              onClick={() =>
                                void handleStatusChange(
                                  message.id,
                                  status
                                )
                              }
                            >
                              {isUpdating &&
                              message.status !== status &&
                              status === 'read' ? (
                                <Loader2 className="ml-2 h-3.5 w-3.5 animate-spin" />
                              ) : null}

                              {STATUS_LABELS[status]}
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}