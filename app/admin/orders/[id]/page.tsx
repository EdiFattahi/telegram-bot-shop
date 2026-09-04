'use client'

import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import {
  useParams,
  useRouter,
} from 'next/navigation'

import { Button } from '@/components/ui/button'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import {
  ArrowRight,
  Loader2,
  Package,
  User,
  CreditCard,
  Send,
  CalendarDays,
  Hash,
} from 'lucide-react'

interface Product {
  id: string
  title: string
  slug: string
}

interface UserInfo {
  id: string
  email: string
  name: string | null
}

interface OrderResponse {
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
  product: Product
  user: UserInfo | null
}

interface ErrorResponse {
  error?: string
  message?: string
}

function isErrorResponse(
  value: unknown
): value is ErrorResponse {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false
  }

  const data =
    value as Record<string, unknown>

  return (
    (
      typeof data.error === 'string' ||
      typeof data.error === 'undefined'
    ) &&
    (
      typeof data.message === 'string' ||
      typeof data.message === 'undefined'
    )
  )
}

function isProduct(
  value: unknown
): value is Product {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false
  }

  const product =
    value as Record<string, unknown>

  return (
    typeof product.id === 'string' &&
    typeof product.title === 'string' &&
    typeof product.slug === 'string'
  )
}

function isUserInfo(
  value: unknown
): value is UserInfo {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false
  }

  const user =
    value as Record<string, unknown>

  return (
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    (
      user.name === null ||
      typeof user.name === 'string'
    )
  )
}

function isOrderResponse(
  value: unknown
): value is OrderResponse {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false
  }

  const order =
    value as Record<string, unknown>

  if (
    typeof order.id !== 'string' ||
    typeof order.amount !== 'number' ||
    !Number.isFinite(order.amount) ||
    typeof order.plan !== 'string' ||
    typeof order.status !== 'string' ||
    (
      order.authority !== null &&
      typeof order.authority !== 'string'
    ) ||
    (
      order.paymentRefId !== null &&
      typeof order.paymentRefId !== 'string'
    ) ||
    (
      order.paidAt !== null &&
      typeof order.paidAt !== 'string'
    ) ||
    typeof order.createdAt !== 'string' ||
    typeof order.updatedAt !== 'string' ||
    (
      order.telegramId !== null &&
      typeof order.telegramId !== 'string'
    ) ||
    !isProduct(order.product) ||
    (
      order.user !== null &&
      !isUserInfo(order.user)
    )
  ) {
    return false
  }

  return true
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
    return 'نامشخص'
  }

  return date.toLocaleString('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function getStatusLabel(
  status: string
): string {
  switch (status) {
    case 'pending':
      return 'در انتظار پرداخت'

    case 'processing':
      return 'در حال بررسی پرداخت'

    case 'paid':
      return 'پرداخت شده'

    case 'completed':
      return 'تکمیل شده'

    case 'failed':
      return 'ناموفق'

    case 'cancelled':
      return 'لغو شده'

    default:
      return status || 'نامشخص'
  }
}

function getStatusClassName(
  status: string
): string {
  switch (status) {
    case 'completed':
    case 'paid':
      return 'bg-green-100 text-green-800'

    case 'processing':
      return 'bg-blue-100 text-blue-800'

    case 'pending':
      return 'bg-yellow-100 text-yellow-800'

    case 'failed':
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
      return 'پایه'

    case 'pro':
      return 'حرفه‌ای'

    case 'org':
      return 'سازمانی'

    default:
      return plan || 'نامشخص'
  }
}

function getApiErrorMessage(
  data: unknown,
  fallback: string
): string {
  if (!isErrorResponse(data)) {
    return fallback
  }

  if (
    typeof data.error === 'string' &&
    data.error.trim()
  ) {
    return data.error
  }

  if (
    typeof data.message === 'string' &&
    data.message.trim()
  ) {
    return data.message
  }

  return fallback
}

async function parseJson(
  response: Response
): Promise<unknown> {
  const contentType =
    response.headers.get('content-type')

  if (
    !contentType?.includes(
      'application/json'
    )
  ) {
    return null
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

async function requestOrder(
  orderId: string,
  signal?: AbortSignal
): Promise<OrderResponse> {
  const response = await fetch(
    `/api/admin/orders/${encodeURIComponent(orderId)}`,
    {
      method: 'GET',
      cache: 'no-store',
      signal,
    }
  )

  const data =
    await parseJson(response)

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        data,
        'خطا در دریافت اطلاعات سفارش'
      )
    )
  }

  if (!isOrderResponse(data)) {
    throw new Error(
      'پاسخ سرور برای اطلاعات سفارش نامعتبر است'
    )
  }

  return data
}

async function verifyPayment(
  orderId: string
): Promise<void> {
  const response = await fetch(
    `/api/admin/orders/${encodeURIComponent(
      orderId
    )}/verify-payment`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }
  )

  const data =
    await parseJson(response)

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        data,
        'خطا در بررسی پرداخت'
      )
    )
  }
}

function InfoRow({
  icon,
  label,
  value,
  dir,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  dir?: 'ltr' | 'rtl'
}) {
  return (
    <div className="flex flex-col gap-2 border-b py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>

      <div
        dir={dir}
        className="break-all text-sm font-medium sm:text-left"
      >
        {value}
      </div>
    </div>
  )
}

export default function AdminOrderDetailPage() {
  const router = useRouter()
  const params = useParams()

  const orderId =
    typeof params.id === 'string'
      ? params.id
      : ''

  const [order, setOrder] =
    useState<OrderResponse | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [
    verifyingPayment,
    setVerifyingPayment,
  ] = useState(false)

  useEffect(() => {
    if (!orderId) {
      return
    }

    const controller = new AbortController()

    const loadOrder = async () => {
      try {
        const data = await requestOrder(
          orderId,
          controller.signal
        )

        if (controller.signal.aborted) {
          return
        }

        setOrder(data)
        setError('')
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          return
        }

        console.error(
          'Error fetching order:',
          error
        )

        if (!controller.signal.aborted) {
          setError(
            error instanceof Error
              ? error.message
              : 'خطا در دریافت اطلاعات سفارش'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadOrder()

    return () => {
      controller.abort()
    }
  }, [orderId])

  const handleVerifyPayment = async () => {
    if (
      !order ||
      verifyingPayment ||
      order.status !== 'processing'
    ) {
      return
    }

    setVerifyingPayment(true)
    setError('')

    try {
      await verifyPayment(order.id)

      const refreshedOrder =
        await requestOrder(order.id)

      setOrder(refreshedOrder)
    } catch (error) {
      console.error(
        'Error verifying payment:',
        error
      )

      setError(
        error instanceof Error
          ? error.message
          : 'خطا در بررسی پرداخت'
      )
    } finally {
      setVerifyingPayment(false)
    }
  }

  const handleBack = () => {
    router.push('/admin/orders')
  }

  if (!orderId) {
    return (
      <div className="mx-auto w-full max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>
              شناسه سفارش نامعتبر است
            </CardTitle>

            <CardDescription>
              شناسه سفارش در آدرس صفحه وجود ندارد یا معتبر نیست.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button
              variant="outline"
              onClick={handleBack}
            >
              <ArrowRight className="ml-2 h-4 w-4" />
              بازگشت به سفارش‌ها
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl py-8">
        <Card>
          <CardContent className="flex min-h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <Loader2 className="h-8 w-8 animate-spin" />

              <p className="text-sm text-muted-foreground">
                در حال دریافت اطلاعات سفارش...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="mx-auto w-full max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>
              دریافت اطلاعات سفارش ناموفق بود
            </CardTitle>

            <CardDescription>
              اطلاعات سفارش قابل بارگذاری نیست.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error || 'سفارش یافت نشد'}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
            >
              <ArrowRight className="ml-2 h-4 w-4" />
              بازگشت به سفارش‌ها
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            جزئیات سفارش
          </h1>

          <p
            dir="ltr"
            className="mt-1 break-all text-sm text-muted-foreground"
          >
            {order.id}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
        >
          <ArrowRight className="ml-2 h-4 w-4" />
          بازگشت
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />

              <CardTitle>
                اطلاعات سفارش
              </CardTitle>
            </div>

            <CardDescription>
              اطلاعات اصلی سفارش و محصول
            </CardDescription>
          </CardHeader>

          <CardContent>
            <InfoRow
              icon={
                <Hash className="h-4 w-4" />
              }
              label="شناسه سفارش"
              value={order.id}
              dir="ltr"
            />

            <InfoRow
              icon={
                <Package className="h-4 w-4" />
              }
              label="محصول"
              value={order.product.title}
            />

            <InfoRow
              icon={
                <Hash className="h-4 w-4" />
              }
              label="اسلاگ محصول"
              value={order.product.slug}
              dir="ltr"
            />

            <InfoRow
              icon={
                <CreditCard className="h-4 w-4" />
              }
              label="پلن"
              value={getPlanLabel(order.plan)}
            />

            <InfoRow
              icon={
                <CreditCard className="h-4 w-4" />
              }
              label="مبلغ"
              value={formatPrice(order.amount)}
            />

            <InfoRow
              icon={
                <CreditCard className="h-4 w-4" />
              }
              label="وضعیت"
              value={
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClassName(
                    order.status
                  )}`}
                >
                  {getStatusLabel(
                    order.status
                  )}
                </span>
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />

              <CardTitle>
                اطلاعات مشتری
              </CardTitle>
            </div>

            <CardDescription>
              اطلاعات کاربر مرتبط با سفارش
            </CardDescription>
          </CardHeader>

          <CardContent>
            {order.user ? (
              <>
                <InfoRow
                  icon={
                    <User className="h-4 w-4" />
                  }
                  label="نام"
                  value={
                    order.user.name ||
                    'ثبت نشده'
                  }
                />

                <InfoRow
                  icon={
                    <User className="h-4 w-4" />
                  }
                  label="ایمیل"
                  value={order.user.email}
                  dir="ltr"
                />

                <InfoRow
                  icon={
                    <Hash className="h-4 w-4" />
                  }
                  label="شناسه کاربر"
                  value={order.user.id}
                  dir="ltr"
                />
              </>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                این سفارش به حساب کاربری متصل نیست.
              </div>
            )}

            {order.telegramId && (
              <InfoRow
                icon={
                  <Send className="h-4 w-4" />
                }
                label="Telegram ID"
                value={order.telegramId}
                dir="ltr"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />

              <CardTitle>
                اطلاعات پرداخت
              </CardTitle>
            </div>

            <CardDescription>
              اطلاعات تراکنش و پرداخت زرین‌پال
            </CardDescription>
          </CardHeader>

          <CardContent>
            <InfoRow
              icon={
                <Hash className="h-4 w-4" />
              }
              label="Authority"
              value={
                order.authority ||
                'ثبت نشده'
              }
              dir="ltr"
            />

            <InfoRow
              icon={
                <Hash className="h-4 w-4" />
              }
              label="Payment Reference"
              value={
                order.paymentRefId ||
                'ثبت نشده'
              }
              dir="ltr"
            />

            <InfoRow
              icon={
                <CalendarDays className="h-4 w-4" />
              }
              label="زمان پرداخت"
              value={
                order.paidAt
                  ? formatDate(order.paidAt)
                  : 'پرداخت نشده'
              }
            />

            {order.status === 'processing' && (
              <div className="mt-4 border-t pt-4">
                <Button
                  type="button"
                  onClick={() =>
                    void handleVerifyPayment()
                  }
                  disabled={verifyingPayment}
                  className="w-full"
                >
                  {verifyingPayment ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      در حال بررسی پرداخت...
                    </>
                  ) : (
                    <>
                      <CreditCard className="ml-2 h-4 w-4" />
                      بررسی و تأیید پرداخت
                    </>
                  )}
                </Button>

                <p className="mt-2 text-xs text-muted-foreground">
                  وضعیت پرداخت مستقیماً از طریق
                  درگاه زرین‌پال بررسی می‌شود.
                </p>
              </div>
            )}

            {order.status === 'completed' && (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                پرداخت این سفارش با موفقیت تأیید شده است.
              </div>
            )}

            {order.status === 'cancelled' && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                این سفارش لغو شده است.
              </div>
            )}

            {order.status === 'failed' && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                پرداخت این سفارش ناموفق بوده است.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />

              <CardTitle>
                تاریخچه زمانی
              </CardTitle>
            </div>

            <CardDescription>
              زمان ایجاد و آخرین تغییر سفارش
            </CardDescription>
          </CardHeader>

          <CardContent>
            <InfoRow
              icon={
                <CalendarDays className="h-4 w-4" />
              }
              label="تاریخ ایجاد"
              value={formatDate(
                order.createdAt
              )}
            />

            <InfoRow
              icon={
                <CalendarDays className="h-4 w-4" />
              }
              label="آخرین بروزرسانی"
              value={formatDate(
                order.updatedAt
              )}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-start border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
        >
          <ArrowRight className="ml-2 h-4 w-4" />
          بازگشت به لیست سفارش‌ها
        </Button>
      </div>
    </div>
  )
}