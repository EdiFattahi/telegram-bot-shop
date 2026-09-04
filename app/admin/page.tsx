import { prisma } from '@/lib/prisma'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  CheckCircle2,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react'

function formatNumber(value: number) {
  return value.toLocaleString('fa-IR')
}

function formatPrice(value: number) {
  return `${formatNumber(value)} تومان`
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'pending':
      return 'در انتظار'

    case 'processing':
      return 'در حال پردازش'

    case 'completed':
      return 'تکمیل شده'

    case 'cancelled':
      return 'لغو شده'

    case 'refunded':
      return 'مسترد شده'

    default:
      return 'نامشخص'
  }
}

function getStatusClassName(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'

    case 'processing':
      return 'bg-blue-100 text-blue-800'

    case 'completed':
      return 'bg-green-100 text-green-800'

    case 'cancelled':
      return 'bg-red-100 text-red-800'

    case 'refunded':
      return 'bg-gray-100 text-gray-800'

    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export default async function AdminDashboard() {
  let totalProducts = 0
  let totalOrders = 0
  let totalUsers = 0
  let completedOrders = 0
  let totalRevenue = 0

  type RecentOrder = {
    id: string
    amount: number
    plan: string
    status: string
    createdAt: Date
    product: {
      title: string
      slug: string
    }
    user: {
      email: string
      name: string | null
    } | null
  }

  let recentOrders: RecentOrder[] = []
  let hasDatabaseError = false

  try {
    const [
      productsCount,
      ordersCount,
      usersCount,
      completedOrdersCount,
      revenue,
      recent,
    ] = await Promise.all([
      prisma.product.count(),

      prisma.order.count(),

      prisma.user.count(),

      prisma.order.count({
        where: {
          status: 'completed',
        },
      }),

      prisma.order.aggregate({
        where: {
          status: 'completed',
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.order.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          amount: true,
          plan: true,
          status: true,
          createdAt: true,

          product: {
            select: {
              title: true,
              slug: true,
            },
          },

          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      }),
    ])

    totalProducts = productsCount
    totalOrders = ordersCount
    totalUsers = usersCount
    completedOrders = completedOrdersCount
    totalRevenue = revenue._sum.amount ?? 0
    recentOrders = recent
  } catch (error) {
    hasDatabaseError = true

    console.error(
      'Error fetching admin dashboard data:',
      error
    )
  }

  const stats = [
    {
      title: 'کل محصولات',
      value: formatNumber(totalProducts),
      icon: Package,
      description: 'محصولات ثبت‌شده',
    },
    {
      title: 'کل سفارشات',
      value: formatNumber(totalOrders),
      icon: ShoppingCart,
      description: 'تمام سفارش‌ها',
    },
    {
      title: 'کاربران',
      value: formatNumber(totalUsers),
      icon: Users,
      description: 'کاربران ثبت‌شده',
    },
    {
      title: 'درآمد کل',
      value: formatPrice(totalRevenue),
      icon: TrendingUp,
      description: 'فقط سفارش‌های تکمیل‌شده',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          داشبورد مدیریت
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          نمای کلی وضعیت محصولات، سفارش‌ها و کاربران
        </p>
      </div>

      {/* Database Error */}
      {hasDatabaseError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          دریافت اطلاعات داشبورد با مشکل مواجه شد.
          لطفاً اتصال Database را بررسی کنید.
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <Card key={stat.title}>
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">
                      {stat.title}
                    </p>

                    <p className="mt-2 break-words text-2xl font-bold sm:text-3xl">
                      {stat.value}
                    </p>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </div>

                  <div className="shrink-0 rounded-lg bg-primary/10 p-3">
                    <Icon className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Completed Orders Summary */}
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-3">
                <CheckCircle2 className="h-5 w-5 text-green-700" />
              </div>

              <div>
                <p className="font-semibold">
                  سفارش‌های تکمیل‌شده
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  تعداد سفارش‌هایی که پرداخت آن‌ها با موفقیت
                  نهایی شده است
                </p>
              </div>
            </div>

            <div className="text-2xl font-bold">
              {formatNumber(completedOrders)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>
            آخرین سفارشات
          </CardTitle>
        </CardHeader>

        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      شماره سفارش
                    </th>

                    <th className="px-4 py-3 text-right text-sm font-medium">
                      محصول
                    </th>

                    <th className="px-4 py-3 text-right text-sm font-medium">
                      مشتری
                    </th>

                    <th className="px-4 py-3 text-right text-sm font-medium">
                      مبلغ
                    </th>

                    <th className="px-4 py-3 text-right text-sm font-medium">
                      وضعیت
                    </th>

                    <th className="px-4 py-3 text-right text-sm font-medium">
                      تاریخ
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b last:border-b-0 hover:bg-muted/50"
                    >
                      {/* Order ID */}
                      <td className="px-4 py-3">
                        <span
                          className="font-mono text-xs"
                          title={order.id}
                        >
                          {order.id.slice(0, 10)}…
                        </span>
                      </td>

                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {order.product.title}
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          {order.product.slug}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        {order.user ? (
                          <div>
                            <div className="font-medium">
                              {order.user.name || 'بدون نام'}
                            </div>

                            <div className="mt-1 text-xs text-muted-foreground">
                              {order.user.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            مهمان
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        {formatPrice(order.amount)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClassName(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center">
              <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground/50" />

              <p className="mt-3 text-sm text-muted-foreground">
                هنوز سفارشی ثبت نشده است
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}