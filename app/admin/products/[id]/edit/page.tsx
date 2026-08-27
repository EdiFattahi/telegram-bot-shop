'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  useEffect(() => {
    fetchProduct()
  }, [])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`)
      if (!response.ok) throw new Error('خطا در دریافت اطلاعات محصول')
      
      const product = await response.json()
      
      setFormData({
        title: product.title,
        slug: product.slug,
        description: product.description,
        shortDesc: product.shortDesc,
        priceBase: product.priceBase.toString(),
        pricePro: product.pricePro.toString(),
        priceOrg: product.priceOrg.toString(),
        features: JSON.parse(product.features).join('\n'),
        demoUrl: product.demoUrl || '',
        imageUrl: product.imageUrl || '',
        status: product.status,
      })
    } catch (error) {
      setError('خطا در بارگذاری اطلاعات محصول')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
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
        throw new Error(data.error || 'خطا در ویرایش محصول')
      }

      router.push('/admin/products')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'خطایی رخ داد. دوباره تلاش کنید')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">در حال بارگذاری...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">ویرایش محصول</h1>
      
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
                <Label htmlFor="pricePro">قیمت حرفه‌ای (تومان) *</Label>
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
              <Label htmlFor="features">ویژگی‌ها (هر خط یک ویژگی) *</Label>
              <Textarea
                id="features"
                name="features"
                value={formData.features}
                onChange={handleChange}
                rows={6}
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

            <div className="space-y-2">
              <Label htmlFor="status">وضعیت</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="coming-soon">به زودی</SelectItem>
                  <SelectItem value="inactive">غیرفعال</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={saving}>
                {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
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