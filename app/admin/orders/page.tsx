'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Eye, RefreshCw } from 'lucide-react'

interface Order {
  id: string
  product: {
    title: string
  }
  user: {
    email: string
    name: string | null
  } | null
  amount: number
  plan: string
  status: string
  createdAt: string
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders')
      if (!response.ok) throw new Error('خطا در دریافت سفارشات')
      
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('خطا در به‌روزرسانی سفارش')

      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      )
    } catch (error) {
      alert('خطا در به‌روزرسانی وضعیت سفارش')
    } finally {
      setUpdating(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">در انتظار</Badge>
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">در حال پردازش</Badge>
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">تکمیل شده</Badge>
      case 'cancelled':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">لغو شده</Badge>
      case 'refunded':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">مسترد شده</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter)

  const formatPrice = (price: number) => {
    return price.toLocaleString('fa-IR') + ' تومان'
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fa-IR')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">مدیریت سفارشات</h1>
        <Button variant="outline" onClick={fetchOrders}>
          <RefreshCw className="ml-2 h-4 w-4" />
          به‌روزرسانی
        </Button>
      </div>

      <div className="flex gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="فیلتر وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="pending">در انتظار</SelectItem>
            <SelectItem value="processing">در حال پردازش</SelectItem>
            <SelectItem value="completed">تکمیل شده</SelectItem>
            <SelectItem value="cancelled">لغو شده</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>سفارشات ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">در حال بارگذاری...</div>
          ) : filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-4">شماره</th>
                    <th className="text-right py-3 px-4">محصول</th>
                    <th className="text-right py-3 px-4">مشتری</th>
                    <th className="text-right py-3 px-4">پلن</th>
                    <th className="text-right py-3 px-4">مبلغ</th>
                    <th className="text-right py-3 px-4">وضعیت</th>
                    <th className="text-right py-3 px-4">تاریخ</th>
                    <th className="text-right py-3 px-4">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{order.id.slice(0, 8)}</td>
                      <td className="py-3 px-4">{order.product.title}</td>
                      <td className="py-3 px-4">
                        {order.user?.email || 'مهمان'}
                      </td>
                      <td className="py-3 px-4">{order.plan}</td>
                      <td className="py-3 px-4">{formatPrice(order.amount)}</td>
                      <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                      <td className="py-3 px-4">{formatDate(order.createdAt)}</td>
                      <td className="py-3 px-4">
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                          disabled={updating === order.id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">در انتظار</SelectItem>
                            <SelectItem value="processing">در حال پردازش</SelectItem>
                            <SelectItem value="completed">تکمیل شده</SelectItem>
                            <SelectItem value="cancelled">لغو شده</SelectItem>
                            <SelectItem value="refunded">مسترد شده</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              سفارشی یافت نشد
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}