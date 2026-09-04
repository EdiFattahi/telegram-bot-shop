'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { Button } from '@/components/ui/button'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import {
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Save,
  ShoppingBag,
} from 'lucide-react'

// ============================================================
// Types
// ============================================================

interface UserProduct {
  id: string
  title: string
  slug: string
}

interface UserOrder {
  id: string
  amount: number
  plan: string
  status: string
  authority: string | null
  paymentRefId: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
  telegramId: string | null
  product: UserProduct
}

interface UserApiResponse {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  updatedAt: string
  orders: UserOrder[]
}

interface User {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  updatedAt: string
  orders: UserOrder[]
}

type UserRole = 'USER' | 'ADMIN'

// ============================================================
// Validation
// ============================================================

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

  if (!Array.isArray(user.orders)) {
    return false
  }

  for (const item of user.orders) {
    if (
      typeof item !== 'object' ||
      item === null ||
      Array.isArray(item)
    ) {
      return false
    }

    const order =
      item as Record<string, unknown>

    if (
      typeof order.id !== 'string' ||
      typeof order.amount !== 'number' ||
      !Number.isSafeInteger(order.amount) ||
      order.amount < 0 ||
      typeof order.plan !== 'string' ||
      typeof order.status !== 'string' ||
      typeof order.createdAt !== 'string' ||
      typeof order.updatedAt !== 'string'
    ) {
      return false
    }

    if (
      order.authority !== null &&
      typeof order.authority !== 'string'
    ) {
      return false
    }

    if (
      order.paymentRefId !== null &&
      typeof order.paymentRefId !== 'string'
    ) {
      return false
    }

    if (
      order.paidAt !== null &&
      typeof order.paidAt !== 'string'
    ) {
      return false
    }

    if (
      order.telegramId !== null &&
      typeof order.telegramId !== 'string'
    ) {
      return false
    }

    if (
      typeof order.product !== 'object' ||
      order.product === null ||
      Array.isArray(order.product)
    ) {
      return false
    }

    const product =
      order.product as Record<string, unknown>

    if (
      typeof product.id !== 'string' ||
      typeof product.title !== 'string' ||
      typeof product.slug !== 'string'
    ) {
      return false
    }
  }

  return true
}

// ============================================================
// Helpers
// ============================================================

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
  role: string
): string {
  switch (role) {
    case 'ADMIN':
      return 'مدیر'

    case 'USER':
      return 'کاربر'

    default:
      return role || '—'
  }
}

function getOrderStatusLabel(
  status: string
): string {
  switch (status) {
    case 'pending':
      return 'در انتظار پرداخت'

    case 'processing':
      return 'در حال پردازش'

    case 'paid':
      return 'پرداخت شده'

    case 'completed':
      return 'تکمیل شده'

    case 'failed':
      return 'ناموفق'

    case 'cancelled':
      return 'لغو شده'

    default:
      return status || '—'
  }
}

function getOrderStatusClassName(
  status: string
): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'

    case 'processing':
      return 'bg-blue-100 text-blue-800'

    case 'paid':
      return 'bg-emerald-100 text-emerald-800'

    case 'completed':
      return 'bg-green-100 text-green-800'

    case 'failed':
      return 'bg-orange-100 text-orange-800'

    case 'cancelled':
      return 'bg-red-100 text-red-800'

    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getPlanLabel(
  plan: string
): string {
  switch (plan) {
    case 'base':
    case 'پایه':
      return 'پایه'

    case 'pro':
    case 'حرفه‌ای':
      return 'حرفه‌ای'

    case 'org':
    case 'سازمانی':
      return 'سازمانی'

    default:
      return plan || '—'
  }
}

function formatPrice(
  amount: number
): string {
  return `${amount.toLocaleString('fa-IR')} تومان`
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

// ============================================================
// API Request - GET
// ============================================================

async function requestUser(
  userId: string,
  signal?: AbortSignal
): Promise<User> {
  const response = await fetch(
    `/api/admin/users/${encodeURIComponent(userId)}`,
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
        'خطا در دریافت اطلاعات کاربر'
      )
    )
  }

  if (!isUserApiResponse(data)) {
    throw new Error(
      'ساختار پاسخ کاربر نامعتبر است'
    )
  }

  return data
}

// ============================================================
// API Request - PATCH
// ============================================================

async function updateUser(
  userId: string,
  payload: {
    name?: string | null
    email?: string
    role?: UserRole
  }
): Promise<UserApiResponse> {
  const response = await fetch(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
        'خطا در ویرایش اطلاعات کاربر'
      )
    )
  }

  if (!isUserApiResponse(data)) {
    throw new Error(
      'ساختار پاسخ کاربر نامعتبر است'
    )
  }

  return data
}

// ============================================================
// Page
// ============================================================

export default function AdminUserDetailsPage() {
  const params = useParams<{
    id: string
  }>()

  const userId = params.id

  const [user, setUser] =
    useState<User | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  // ============================================================
  // Edit Form State
  // ============================================================

  const [name, setName] =
    useState('')

  const [email, setEmail] =
    useState('')

  const [role, setRole] =
    useState<UserRole>('USER')

  const [saving, setSaving] =
    useState(false)

  const [saveError, setSaveError] =
    useState('')

  const [saveSuccess, setSaveSuccess] =
    useState('')

  // ============================================================
  // Load User
  // ============================================================

  const loadUser = useCallback(
    async (signal?: AbortSignal) => {
      if (!userId) {
        setError(
          'شناسه کاربر مشخص نیست'
        )
        setLoading(false)
        return
      }

      try {
        const data =
          await requestUser(
            userId,
            signal
          )

        if (signal?.aborted) {
          return
        }

        setUser(data)

        setName(data.name ?? '')
        setEmail(data.email)
        setRole(
          data.role === 'ADMIN'
            ? 'ADMIN'
            : 'USER'
        )

        setError('')
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          return
        }

        console.error(
          'Error fetching user:',
          error
        )

        if (!signal?.aborted) {
          setError(
            error instanceof Error
              ? error.message
              : 'خطا در دریافت اطلاعات کاربر'
          )
        }
      }
    },
    [userId]
  )

  // ============================================================
  // Initial Load
  // ============================================================

  useEffect(() => {
    const controller =
      new AbortController()

    const timer =
      window.setTimeout(() => {
        void loadUser(
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
  }, [loadUser])

  // ============================================================
  // Refresh
  // ============================================================

  const handleRefresh =
    async () => {
      setLoading(true)
      setError('')
      setSaveError('')
      setSaveSuccess('')

      try {
        await loadUser()
      } finally {
        setLoading(false)
      }
    }

  // ============================================================
  // Save User
  // ============================================================

  const handleSave =
    async (
      event: React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault()

      if (!userId) {
        setSaveError(
          'شناسه کاربر مشخص نیست'
        )
        return
      }

      setSaving(true)
      setSaveError('')
      setSaveSuccess('')

      const trimmedName =
        name.trim()

      const trimmedEmail =
        email.trim().toLowerCase()

      try {
        const updatedUser =
          await updateUser(
            userId,
            {
              name:
                trimmedName.length > 0
                  ? trimmedName
                  : null,
              email: trimmedEmail,
              role,
            }
          )

        setUser(updatedUser)

        setName(
          updatedUser.name ?? ''
        )

        setEmail(
          updatedUser.email
        )

        setRole(
          updatedUser.role === 'ADMIN'
            ? 'ADMIN'
            : 'USER'
        )

        setSaveSuccess(
          'اطلاعات کاربر با موفقیت ذخیره شد.'
        )
      } catch (error) {
        console.error(
          'Error updating user:',
          error
        )

        setSaveError(
          error instanceof Error
            ? error.message
            : 'خطا در ویرایش اطلاعات کاربر'
        )
      } finally {
        setSaving(false)
      }
    }

  // ============================================================
  // Loading
  // ============================================================

  if (loading) {
    return (
      <div
        className="flex min-h-96 items-center justify-center"
        dir="rtl"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />

          <p className="text-sm text-muted-foreground">
            در حال بارگذاری اطلاعات کاربر...
          </p>
        </div>
      </div>
    )
  }

  // ============================================================
  // Error
  // ============================================================

  if (error || !user) {
    return (
      <div
        className="space-y-6"
        dir="rtl"
      >
        <div className="flex items-center justify-between">
          <Link
            href="/admin/users"
            className="inline-flex items-center text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            بازگشت به کاربران
          </Link>

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

        <div
          role="alert"
          className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700"
        >
          <AlertTriangle className="h-8 w-8" />

          <p className="font-medium">
            {error ||
              'اطلاعات کاربر یافت نشد'}
          </p>
        </div>
      </div>
    )
  }

  // ============================================================
  // Statistics
  // ============================================================

  const totalOrders =
    user.orders.length

  const paidOrders =
    user.orders.filter(
      (order) =>
        order.status === 'paid' ||
        order.status === 'completed'
    )

  const totalPaidAmount =
    paidOrders.reduce(
      (total, order) =>
        total + order.amount,
      0
    )

  // ============================================================
  // Render
  // ============================================================

  return (
    <div
      className="space-y-6"
      dir="rtl"
    >
      {/* ======================================================
          Header
      ====================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href="/admin/users"
            className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            بازگشت به کاربران
          </Link>

          <h1 className="text-3xl font-bold tracking-tight">
            جزئیات کاربر
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            مشاهده و ویرایش اطلاعات کاربر و سوابق سفارش‌ها.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            void handleRefresh()
          }
          disabled={loading || saving}
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

      {/* ======================================================
          Edit User
      ====================================================== */}

      <Card>
        <CardHeader>
          <CardTitle>
            ویرایش اطلاعات کاربر
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSave}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Name */}

              <div className="space-y-2">
                <label
                  htmlFor="user-name"
                  className="text-sm font-medium"
                >
                  نام
                </label>

                <input
                  id="user-name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  maxLength={100}
                  disabled={saving}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="نام کاربر"
                />

                <p className="text-xs text-muted-foreground">
                  در صورت خالی بودن، نام کاربر حذف می‌شود.
                </p>
              </div>

              {/* Email */}

              <div className="space-y-2">
                <label
                  htmlFor="user-email"
                  className="text-sm font-medium"
                >
                  ایمیل
                </label>

                <input
                  id="user-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  maxLength={254}
                  required
                  disabled={saving}
                  dir="ltr"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-right outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="user@example.com"
                />
              </div>

              {/* Role */}

              <div className="space-y-2">
                <label
                  htmlFor="user-role"
                  className="text-sm font-medium"
                >
                  نقش
                </label>

                <select
                  id="user-role"
                  name="role"
                  value={role}
                  onChange={(event) =>
                    setRole(
                      event.target.value as UserRole
                    )
                  }
                  disabled={saving}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="USER">
                    کاربر
                  </option>

                  <option value="ADMIN">
                    مدیر
                  </option>
                </select>
              </div>
            </div>

            {/* Save Error */}

            {saveError && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {saveError}
              </div>
            )}

            {/* Save Success */}

            {saveSuccess && (
              <div
                role="status"
                className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
              >
                {saveSuccess}
              </div>
            )}

            {/* Save */}

            <div className="flex justify-start">
              <Button
                type="submit"
                disabled={
                  saving ||
                  email.trim().length === 0
                }
              >
                {saving ? (
                  <>
                    <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Save className="ml-2 h-4 w-4" />
                    ذخیره تغییرات
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ======================================================
          User Information
      ====================================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              اطلاعات کاربر
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">
                  نام
                </p>

                <p className="mt-1 font-medium">
                  {user.name?.trim() ||
                    'بدون نام'}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  ایمیل
                </p>

                <p
                  dir="ltr"
                  className="mt-1 text-right font-medium"
                >
                  {user.email}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  نقش
                </p>

                <p className="mt-1 font-medium">
                  {getRoleLabel(
                    user.role
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  شناسه کاربر
                </p>

                <p
                  dir="ltr"
                  className="mt-1 truncate text-right font-mono text-sm"
                  title={user.id}
                >
                  {user.id}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  تاریخ عضویت
                </p>

                <p className="mt-1">
                  {formatDate(
                    user.createdAt
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  آخرین بروزرسانی
                </p>

                <p className="mt-1">
                  {formatDate(
                    user.updatedAt
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ====================================================
            Statistics
        ==================================================== */}

        <Card>
          <CardHeader>
            <CardTitle>
              خلاصه فعالیت
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground">
                کل سفارش‌ها
              </p>

              <p className="mt-1 text-2xl font-bold">
                {totalOrders.toLocaleString(
                  'fa-IR'
                )}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                سفارش‌های پرداخت‌شده
              </p>

              <p className="mt-1 text-2xl font-bold">
                {paidOrders.length.toLocaleString(
                  'fa-IR'
                )}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                مجموع پرداخت
              </p>

              <p className="mt-1 text-xl font-bold">
                {formatPrice(
                  totalPaidAmount
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ======================================================
          Orders
      ====================================================== */}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>
              سفارش‌های کاربر (
              {totalOrders.toLocaleString(
                'fa-IR'
              )}
              )
            </CardTitle>

            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>

        <CardContent>
          {user.orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      سفارش
                    </th>

                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      محصول
                    </th>

                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      پلن
                    </th>

                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      مبلغ
                    </th>

                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      وضعیت
                    </th>

                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      تاریخ
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {user.orders.map(
                    (order) => (
                      <tr
                        key={order.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <p
                              dir="ltr"
                              className="max-w-[180px] truncate text-right font-medium"
                              title={order.id}
                            >
                              {order.id}
                            </p>

                            {order.authority && (
                              <p
                                dir="ltr"
                                className="max-w-[180px] truncate text-right text-xs text-muted-foreground"
                                title={
                                  order.authority
                                }
                              >
                                Authority:{' '}
                                {
                                  order.authority
                                }
                              </p>
                            )}

                            {order.paymentRefId && (
                              <p
                                dir="ltr"
                                className="max-w-[180px] truncate text-right text-xs text-muted-foreground"
                                title={
                                  order.paymentRefId
                                }
                              >
                                Ref:{' '}
                                {
                                  order.paymentRefId
                                }
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <p className="font-medium">
                              {
                                order
                                  .product
                                  .title
                              }
                            </p>

                            <p
                              dir="ltr"
                              className="text-right text-xs text-muted-foreground"
                            >
                              /
                              {
                                order
                                  .product
                                  .slug
                              }
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          {getPlanLabel(
                            order.plan
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          {formatPrice(
                            order.amount
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getOrderStatusClassName(
                              order.status
                            )}`}
                          >
                            {getOrderStatusLabel(
                              order.status
                            )}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="space-y-1">
                            <p className="text-sm">
                              {formatDate(
                                order.createdAt
                              )}
                            </p>

                            {order.paidAt && (
                              <p className="text-xs text-green-700">
                                پرداخت:{' '}
                                {formatDate(
                                  order.paidAt
                                )}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />

              <p className="font-medium">
                این کاربر هنوز سفارشی ثبت نکرده است
              </p>

              <p className="text-sm text-muted-foreground">
                سفارش‌های کاربر پس از ثبت در این بخش نمایش داده می‌شوند.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}