import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, ShoppingCart, Package, TrendingUp } from 'lucide-react'

export default async function AdminDashboard() {
  let totalProducts = 0
  let totalOrders = 0
  let totalUsers = 0
  let recentOrders: any[] = []
  
  try {
    const [products, orders, users, recent] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: true,
          user: true
        }
      })
    ])
    
    totalProducts = products
    totalOrders = orders
    totalUsers = users
    recentOrders = recent
  } catch (error) {
    console.error('Error fetching admin data:', error)
  }

  const stats = [
    { title: 'کل محصولات', value: totalProducts, icon: Package },
    { title: 'کل سفارشات', value: totalOrders, icon: ShoppingCart },
    { title: 'کاربران', value: totalUsers, icon: Users },
    { title: 'درآمد کل', value: '۰ تومان', icon: TrendingUp },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">داشبورد مدیریت</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className="w-10 h-10 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>آخرین سفارشات</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-4">شماره</th>
                    <th className="text-right py-3 px-4">محصول</th>
                    <th className="text-right py-3 px-4">مشتری</th>
                    <th className="text-right py-3 px-4">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order: any) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{order.id.slice(0, 8)}</td>
                      <td className="py-3 px-4">{order.product.title}</td>
                      <td className="py-3 px-4">{order.user?.email || 'مهمان'}</td>
                      <td className="py-3 px-4">{order.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              هنوز سفارشی ثبت نشده است
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}