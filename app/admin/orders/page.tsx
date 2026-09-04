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
AlertTriangle,
RefreshCw,
Eye,
} from 'lucide-react'

const VALID_STATUSES = [
'pending',
'processing',
'paid',
'completed',
'failed',
'cancelled',
] as const

type OrderStatus = (typeof VALID_STATUSES)[number]

interface OrderProduct {
title: string
slug: string
}

interface OrderUser {
email: string
name: string | null
}

interface OrderApiResponse {
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
product: OrderProduct
user: OrderUser | null
}

interface Order {
id: string
amount: number
plan: string
status: OrderStatus
authority: string | null
paymentRefId: string | null
paidAt: string | null
createdAt: string
updatedAt: string
telegramId: string | null
product: OrderProduct
user: OrderUser | null
}

function isValidStatus(
status: string
): status is OrderStatus {
return VALID_STATUSES.includes(
status as OrderStatus
)
}

function normalizeStatus(
status: string
): OrderStatus {
return isValidStatus(status)
? status
: 'pending'
}

function isOrderApiResponse(
value: unknown
): value is OrderApiResponse {
if (
typeof value !== 'object' ||
value === null ||
Array.isArray(value)
) {
return false
}

const order =
value as Record<string, unknown>

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
typeof product.title !== 'string' ||
typeof product.slug !== 'string'
) {
return false
}

if (
order.user !== null &&
(
typeof order.user !== 'object' ||
Array.isArray(order.user)
)
) {
return false
}

if (order.user !== null) {
const user =
order.user as Record<string, unknown>

if (
  typeof user.email !== 'string' ||
  (
    user.name !== null &&
    typeof user.name !== 'string'
  )
) {
  return false
}

}

return true
}

function normalizeOrder(
order: OrderApiResponse
): Order {
return {
...order,
status: normalizeStatus(order.status),
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

function getStatusLabel(
status: OrderStatus
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
}
}

function getStatusClassName(
status: OrderStatus
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

}
}

function getPlanLabel(
plan: string
): string {
switch (plan) {
case 'base':
return 'پایه'

 
case 'pro':
  return 'حرفه‌ای'

case 'org':
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

function formatCustomer(
user: OrderUser | null
): string {
if (!user) {
return 'کاربر مهمان'
}

return user.name?.trim() || user.email
}

async function requestOrders(
signal?: AbortSignal
): Promise<Order[]> {
const response = await fetch(
'/api/admin/orders',
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
'خطا در دریافت سفارشات'
)
)
}

if (!Array.isArray(data)) {
throw new Error(
'پاسخ سرور نامعتبر است'
)
}

for (const item of data) {
if (!isOrderApiResponse(item)) {
throw new Error(
'ساختار پاسخ سفارشات نامعتبر است'
)
}
}

return data.map(
(item) =>
normalizeOrder(item)
)
}

export default function AdminOrdersPage() {
const [orders, setOrders] =
useState<Order[]>([])

const [loading, setLoading] =
useState(true)

const [error, setError] =
useState('')

const loadOrders =
useCallback(
async (
signal?: AbortSignal
) => {
try {
const normalizedOrders =
await requestOrders(signal)

 
      if (signal?.aborted) {
        return
      }

      setOrders(
        normalizedOrders
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
        'Error fetching orders:',
        error
      )

      if (!signal?.aborted) {
        setError(
          error instanceof Error
            ? error.message
            : 'خطا در دریافت سفارشات'
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
    void loadOrders(
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
 

}, [loadOrders])

const handleRefresh =
async () => {
setLoading(true)
setError('')

 
  try {
    await loadOrders()
  } finally {
    setLoading(false)
  }
}
 

const totalOrders =
orders.length

const completedOrders =
orders.filter(
(order) =>
order.status === 'completed'
).length

const processingOrders =
orders.filter(
(order) =>
order.status === 'processing'
).length

const pendingOrders =
orders.filter(
(order) =>
order.status === 'pending'
).length

const paidOrders =
orders.filter(
(order) =>
order.status === 'paid' ||
order.status === 'completed'
).length

const totalRevenue =
orders
.filter(
(order) =>
order.status === 'paid' ||
order.status === 'completed'
)
.reduce(
(total, order) =>
total + order.amount,
0
)

return ( <div
   className="space-y-6"
   dir="rtl"
 > <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"> <div> <h1 className="text-3xl font-bold tracking-tight">
مدیریت سفارشات </h1>

 
      <p className="mt-1 text-sm text-muted-foreground">
        مشاهده و بررسی سفارش‌های ثبت‌شده در سیستم.
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

  {error && (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
    >
      {error}
    </div>
  )}

  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">
          کل سفارش‌ها
        </p>

        <p className="mt-2 text-2xl font-bold">
          {totalOrders.toLocaleString(
            'fa-IR'
          )}
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">
          تکمیل‌شده
        </p>

        <p className="mt-2 text-2xl font-bold">
          {completedOrders.toLocaleString(
            'fa-IR'
          )}
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">
          در حال پردازش
        </p>

        <p className="mt-2 text-2xl font-bold">
          {processingOrders.toLocaleString(
            'fa-IR'
          )}
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">
          در انتظار پرداخت
        </p>

        <p className="mt-2 text-2xl font-bold">
          {pendingOrders.toLocaleString(
            'fa-IR'
          )}
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">
          درآمد پرداخت‌شده
        </p>

        <p className="mt-2 text-xl font-bold">
          {formatPrice(
            totalRevenue
          )}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          {paidOrders.toLocaleString(
            'fa-IR'
          )}{' '}
          سفارش پرداخت‌شده
        </p>
      </CardContent>
    </Card>
  </div>

  <Card>
    <CardHeader>
      <CardTitle>
        لیست سفارشات (
        {totalOrders.toLocaleString(
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
              در حال بارگذاری سفارشات...
            </p>
          </div>
        </div>
      ) : orders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  سفارش
                </th>

                <th className="px-4 py-3 text-right text-sm font-semibold">
                  مشتری
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

                <th className="px-4 py-3 text-right text-sm font-semibold">
                  عملیات
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.map(
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
                          {formatCustomer(
                            order.user
                          )}
                        </p>

                        {order.user?.email &&
                          order.user.name && (
                            <p
                              dir="ltr"
                              className="text-right text-xs text-muted-foreground"
                            >
                              {
                                order.user
                                  .email
                              }
                            </p>
                          )}

                        {order.telegramId && (
                          <p
                            dir="ltr"
                            className="text-right text-xs text-muted-foreground"
                          >
                            Telegram:{' '}
                            {
                              order.telegramId
                            }
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {
                            order.product
                              .title
                          }
                        </p>

                        <p
                          dir="ltr"
                          className="text-right text-xs text-muted-foreground"
                        >
                          /
                          {
                            order.product
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
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClassName(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(
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

                    <td className="px-4 py-4">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                      >
                        <Link
                          href={`/admin/orders/${order.id}`}
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
          <AlertTriangle className="h-8 w-8 text-muted-foreground" />

          <p className="font-medium">
            هنوز سفارشی ثبت نشده است
          </p>

          <p className="text-sm text-muted-foreground">
            سفارش‌های ثبت‌شده پس از ایجاد در این بخش نمایش داده می‌شوند.
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
