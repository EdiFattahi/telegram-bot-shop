'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    shortDesc: '',
    priceBase: '',
    pricePro: '',
    priceOrg: '',
    features: '',
    demoUrl: '',
    imageUrl: '',
    status: 'active'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          priceBase: parseInt(formData.priceBase),
          pricePro: parseInt(formData.pricePro),
          priceOrg: parseInt(formData.priceOrg),
          features: formData.features.split('\n').filter(f => f.trim()),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'خطا در ایجاد محصول')
      }

      router.push('/admin/products')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'خطایی رخ داد. دوباره تلاش کنید')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">ایجاد محصول جدید</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>اطلاعات محصول</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان محصول *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">اسلاگ (URL) *</Label>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="my-product"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDesc">توضیح کوتاه *</Label>
              <Input
                id="shortDesc"
                name="shortDesc"
                value={formData.shortDesc}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">توضیحات کامل *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceBase">قیمت پایه (تومان) *</Label>
                <Input
                  id="priceBase"
                  name="priceBase"
                  type="number"
                  value={formData.priceBase}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricePro">قیمت حرفهای (تومان) *</Label>
                <Input
                  id="pricePro"
                  name="pricePro"
                  type="number"
                  value={formData.pricePro}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceOrg">قیمت سازمانی (تومان) *</Label>
                <Input
                  id="priceOrg"
                  name="priceOrg"
                  type="number"
                  value={formData.priceOrg}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">ویژگیها (هر خط یک ویژگی) *</Label>
              <Textarea
                id="features"
                name="features"
                value={formData.features}
                onChange={handleChange}
                rows={6}
                placeholder={'ویژگی ۱\nویژگی ۲\nویژگی ۳'}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="demoUrl">لینک دمو</Label>
              <Input
                id="demoUrl"
                name="demoUrl"
                value={formData.demoUrl}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">لینک تصویر</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="/images/product.jpg"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'در حال ذخیره...' : 'ذخیره محصول'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                انصراف
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}