'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface Product {
  id: string
  title: string
  slug: string
  priceBase: number
  status: string
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products')
      if (!response.ok) throw new Error('خطا در دریافت محصولات')
      
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این محصول مطمئن هستید؟')) return

    setDeleting(id)
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('خطا در حذف محصول')
      }

      // حذف از لیست
      setProducts(prev => prev.filter(p => p.id !== id))
      router.refresh()
    } catch (error) {
      alert('خطا در حذف محصول')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">مدیریت محصولات</h1>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="ml-2 h-4 w-4" />
            محصول جدید
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست محصولات ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">در حال بارگذاری...</div>
          ) : products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-4">عنوان</th>
                    <th className="text-right py-3 px-4">اسلاگ</th>
                    <th className="text-right py-3 px-4">قیمت پایه</th>
                    <th className="text-right py-3 px-4">وضعیت</th>
                    <th className="text-right py-3 px-4">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{product.title}</td>
                      <td className="py-3 px-4">{product.slug}</td>
                      <td className="py-3 px-4">
                        {product.priceBase.toLocaleString('fa-IR')} تومان
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          product.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.status === 'active' ? 'فعال' : 'غیرفعال'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            disabled={deleting === product.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              هنوز محصولی ثبت نشده است
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}