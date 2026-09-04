'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import {
  Eye,
  RefreshCw,
  Users,
} from 'lucide-react'

const VALID_ROLES = [
  'USER',
  'ADMIN',
] as const

type UserRole = (typeof VALID_ROLES)[number]

interface UserApiResponse {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  updatedAt: string
  _count: {
    orders: number
  }
}

interface User {
  id: string
  email: string
  name: string | null
  role: UserRole
  createdAt: string
  updatedAt: string
  ordersCount: number
}

function isValidRole(
  role: string
): role is UserRole {
  return VALID_ROLES.includes(
    role as UserRole
  )
}

function normalizeRole(
  role: string
): UserRole {
  return isValidRole(role)
    ? role
    : 'USER'
}

function isUserApiResponse(
  value: unknown
): value is UserApiResponse {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return false
  }

  const user =
    value as Record<string, unknown>

  if (
    typeof user.id !== 'string' ||
    typeof user.email !== 'string' ||
    typeof user.role !== 'string' ||
    typeof user.createdAt !== 'string' ||
    typeof user.updatedAt !== 'string'
  ) {
    return false
  }

  if (
    user.name !== null &&
    typeof user.name !== 'string'
  ) {
    return false
  }

  if (
    typeof user._count !== 'object' ||
    user._count === null ||
    Array.isArray(user._count)
  ) {
    return false
  }

  const count =
    user._count as Record<string, unknown>

  if (
    typeof count.orders !== 'number' ||
    !Number.isSafeInteger(count.orders) ||
    count.orders < 0
  ) {
    return false
  }

  return true
}

function normalizeUser(
  user: UserApiResponse
): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: normalizeRole(user.role),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    ordersCount: user._count.orders,
  }
}

function getErrorMessage(
  data: unknown,
  fallback: string
): string {
  if (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof data.error === 'string'
  ) {
    return data.error
  }

  return fallback
}

function getRoleLabel(
  role: UserRole
): string {
  switch (role) {
    case 'ADMIN':
      return 'مدیر'

    case 'USER':
      return 'کاربر'
  }
}

function getRoleClassName(
  role: UserRole
): string {
  switch (role) {
    case 'ADMIN':
      return 'bg-purple-100 text-purple-800'

    case 'USER':
      return 'bg-blue-100 text-blue-800'
  }
}

function formatDate(
  value: string
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat(
    'fa-IR',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    }
  ).format(date)
}

function formatName(
  user: User
): string {
  return user.name?.trim() || 'بدون نام'
}

async function requestUsers(
  signal?: AbortSignal
): Promise<User[]> {
  const response = await fetch(
    '/api/admin/users',
    {
      cache: 'no-store',
      signal,
    }
  )

  let data: unknown

  try {
    data = await response.json()
  } catch {
    throw new Error(
      'پاسخ سرور نامعتبر است'
    )
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        'خطا در دریافت کاربران'
      )
    )
  }

  if (!Array.isArray(data)) {
    throw new Error(
      'پاسخ سرور نامعتبر است'
    )
  }

  for (const item of data) {
    if (!isUserApiResponse(item)) {
      throw new Error(
        'ساختار پاسخ کاربران نامعتبر است'
      )
    }
  }

  return data.map(normalizeUser)
}

export default function AdminUsersPage() {
  const [users, setUsers] =
    useState<User[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const loadUsers =
    useCallback(
      async (
        signal?: AbortSignal
      ) => {
        try {
          const normalizedUsers =
            await requestUsers(signal)

          if (signal?.aborted) {
            return
          }

          setUsers(normalizedUsers)
          setError('')
        } catch (error) {
          if (
            error instanceof DOMException &&
            error.name === 'AbortError'
          ) {
            return
          }

          console.error(
            'Error fetching users:',
            error
          )

          if (!signal?.aborted) {
            setError(
              error instanceof Error
                ? error.message
                : 'خطا در دریافت کاربران'
            )
          }
        }
      },
      []
    )

  useEffect(() => {
    const controller =
      new AbortController()

    const timer =
      window.setTimeout(() => {
        void loadUsers(
          controller.signal
        ).finally(() => {
          if (
            !controller.signal.aborted
          ) {
            setLoading(false)
          }
        })
      }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadUsers])

  const handleRefresh =
    async () => {
      setLoading(true)
      setError('')

      try {
        await loadUsers()
      } finally {
        setLoading(false)
      }
    }

  const totalUsers =
    users.length

  const adminUsers =
    users.filter(
      (user) =>
        user.role === 'ADMIN'
    ).length

  const regularUsers =
    users.filter(
      (user) =>
        user.role === 'USER'
    ).length

  const totalOrders =
    users.reduce(
      (total, user) =>
        total + user.ordersCount,
      0
    )

  return (
    <div
      className="space-y-6"
      dir="rtl"
    >
      {/* Header */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            مدیریت کاربران
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            مشاهده و بررسی کاربران ثبت‌شده در سیستم.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            void handleRefresh()
          }
          disabled={loading}
        >
          <RefreshCw
            className={`ml-2 h-4 w-4 ${
              loading
                ? 'animate-spin'
                : ''
            }`}
          />

          به‌روزرسانی
        </Button>
      </div>

      {/* Error */}

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Statistics */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              کل کاربران
            </p>

            <p className="mt-2 text-2xl font-bold">
              {totalUsers.toLocaleString(
                'fa-IR'
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              کاربران عادی
            </p>

            <p className="mt-2 text-2xl font-bold">
              {regularUsers.toLocaleString(
                'fa-IR'
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              مدیران
            </p>

            <p className="mt-2 text-2xl font-bold">
              {adminUsers.toLocaleString(
                'fa-IR'
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              مجموع سفارش‌ها
            </p>

            <p className="mt-2 text-2xl font-bold">
              {totalOrders.toLocaleString(
                'fa-IR'
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users */}

      <Card>
        <CardHeader>
          <CardTitle>
            لیست کاربران (
            {totalUsers.toLocaleString(
              'fa-IR'
            )}
            )
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex min-h-48 items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />

                <p className="text-sm text-muted-foreground">
                  در حال بارگذاری کاربران...
                </p>
              </div>
            </div>
          ) : users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      کاربر
                    </th>

                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      ایمیل
                    </th>

                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      نقش
                    </th>

                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      سفارش‌ها
                    </th>

                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      تاریخ ثبت‌نام
                    </th>

                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      عملیات
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users.map(
                    (user) => (
                      <tr
                        key={user.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <p className="font-medium">
                              {formatName(
                                user
                              )}
                            </p>

                            <p
                              dir="ltr"
                              className="max-w-[180px] truncate text-right text-xs text-muted-foreground"
                              title={user.id}
                            >
                              {user.id}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <p
                            dir="ltr"
                            className="text-right"
                          >
                            {user.email}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getRoleClassName(
                              user.role
                            )}`}
                          >
                            {getRoleLabel(
                              user.role
                            )}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          {user.ordersCount.toLocaleString(
                            'fa-IR'
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          {formatDate(
                            user.createdAt
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                          >
                            <Link
                              href={`/admin/users/${user.id}`}
                            >
                              <Eye className="ml-1 h-4 w-4" />
                              مشاهده
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
              <Users className="h-8 w-8 text-muted-foreground" />

              <p className="font-medium">
                هنوز کاربری ثبت نشده است
              </p>

              <p className="text-sm text-muted-foreground">
                کاربران ثبت‌شده پس از ایجاد در این بخش نمایش داده می‌شوند.
              </p>

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  void handleRefresh()
                }
              >
                <RefreshCw className="ml-2 h-4 w-4" />
                تلاش مجدد
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}