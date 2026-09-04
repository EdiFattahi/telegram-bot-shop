'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const VALID_STATUSES = [
  'active',
  'coming-soon',
  'inactive',
] as const

type ProductStatus = (typeof VALID_STATUSES)[number]

interface ErrorResponse {
  error?: string
}

function isValidStatus(
  value: string
): value is ProductStatus {
  return VALID_STATUSES.includes(
    value as ProductStatus
  )
}

function isErrorResponse(
  value: unknown
): value is ErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    (typeof value.error === 'string' ||
      typeof value.error === 'undefined')
  )
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

function isValidOptionalUrl(
  value: string
): boolean {
  if (!value) {
    return true
  }

  try {
    const url = new URL(value)

    return (
      url.protocol === 'http:' ||
      url.protocol === 'https:'
    )
  } catch {
    return false
  }
}

function isValidImagePathOrUrl(
  value: string
): boolean {
  if (!value) {
    return true
  }

  if (value.startsWith('/')) {
    return !value.startsWith('//')
  }

  return isValidOptionalUrl(value)
}

export default function NewProductPage() {
  const router = useRouter()

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
    status: 'active' as ProductStatus,
  })

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    if (saving) {
      return
    }

    setError('')

    const title = formData.title.trim()
    const slug = formData.slug.trim().toLowerCase()
    const shortDesc = formData.shortDesc.trim()
    const description =
      formData.description.trim()
    const demoUrl = formData.demoUrl.trim()
    const imageUrl = formData.imageUrl.trim()

    if (!title) {
      setError('عنوان محصول الزامی است')
      return
    }

    if (!slug) {
      setError('اسلاگ محصول الزامی است')
      return
    }

    if (!isValidSlug(slug)) {
      setError(
        'اسلاگ فقط می‌تواند شامل حروف انگلیسی کوچک، اعداد و خط تیره باشد'
      )
      return
    }

    if (!shortDesc) {
      setError('توضیح کوتاه محصول الزامی است')
      return
    }

    if (!description) {
      setError('توضیحات کامل محصول الزامی است')
      return
    }

    const priceBase = Number(
      formData.priceBase
    )

    const pricePro = Number(
      formData.pricePro
    )

    const priceOrg = Number(
      formData.priceOrg
    )

    if (
      !Number.isSafeInteger(priceBase) ||
      priceBase <= 0 ||
      !Number.isSafeInteger(pricePro) ||
      pricePro <= 0 ||
      !Number.isSafeInteger(priceOrg) ||
      priceOrg <= 0
    ) {
      setError(
        'قیمت‌ها باید عدد صحیح بزرگ‌تر از صفر باشند'
      )
      return
    }

    const features = formData.features
      .split('\n')
      .map((feature) => feature.trim())
      .filter(Boolean)

    if (features.length === 0) {
      setError(
        'حداقل یک ویژگی برای محصول وارد کنید'
      )
      return
    }

    if (!isValidStatus(formData.status)) {
      setError('وضعیت محصول نامعتبر است')
      return
    }

    if (!isValidOptionalUrl(demoUrl)) {
      setError(
        'لینک دمو باید یک URL معتبر با http یا https باشد'
      )
      return
    }

    if (!isValidImagePathOrUrl(imageUrl)) {
      setError(
        'لینک تصویر باید یک مسیر داخلی معتبر یا URL با http/https باشد'
      )
      return
    }

    setSaving(true)

    try {
      const response = await fetch(
        '/api/admin/products',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            slug,
            description,
            shortDesc,
            priceBase,
            pricePro,
            priceOrg,
            features,
            demoUrl,
            imageUrl,
            status: formData.status,
          }),
        }
      )

      let data: unknown = null

      try {
        data = await response.json()
      } catch {
        data = null
      }

      if (!response.ok) {
        const message =
          isErrorResponse(data) &&
          data.error
            ? data.error
            : 'خطا در ایجاد محصول'

        throw new Error(message)
      }

      router.push('/admin/products')
      router.refresh()
    } catch (err) {
      console.error(
        'Error creating product:',
        err
      )

      setError(
        err instanceof Error
          ? err.message
          : 'خطایی رخ داد. دوباره تلاش کنید'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          ایجاد محصول جدید
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          اطلاعات محصول، قیمت‌ها و ویژگی‌های آن را وارد
          کنید.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            اطلاعات محصول
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="title">
                عنوان محصول *
              </Label>

              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="مثلاً ربات فروشگاهی تلگرام"
                maxLength={200}
                disabled={saving}
                autoComplete="off"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">
                اسلاگ (URL) *
              </Label>

              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="telegram-shop-bot"
                maxLength={100}
                disabled={saving}
                dir="ltr"
                autoComplete="off"
                required
              />

              <p className="text-xs text-muted-foreground">
                فقط حروف انگلیسی کوچک، اعداد و خط تیره.
                مثال: telegram-shop-bot
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDesc">
                توضیح کوتاه *
              </Label>

              <Input
                id="shortDesc"
                name="shortDesc"
                value={formData.shortDesc}
                onChange={handleChange}
                placeholder="یک توضیح کوتاه و واضح درباره محصول"
                maxLength={300}
                disabled={saving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                توضیحات کامل *
              </Label>

              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="توضیحات کامل محصول، کاربردها و مزایای آن..."
                rows={7}
                maxLength={5000}
                disabled={saving}
                required
              />

              <p className="text-xs text-muted-foreground">
                توضیحات واضح‌تر به کاربر کمک می‌کند قبل از
                خرید محصول را بهتر بشناسد.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <h2 className="text-base font-semibold">
                  قیمت‌گذاری
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  قیمت‌ها به تومان وارد می‌شوند.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="priceBase">
                    قیمت پایه *
                  </Label>

                  <Input
                    id="priceBase"
                    name="priceBase"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={formData.priceBase}
                    onChange={handleChange}
                    placeholder="500000"
                    disabled={saving}
                    dir="ltr"
                    required
                  />

                  <p className="text-xs text-muted-foreground">
                    تومان
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricePro">
                    قیمت حرفه‌ای *
                  </Label>

                  <Input
                    id="pricePro"
                    name="pricePro"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={formData.pricePro}
                    onChange={handleChange}
                    placeholder="1000000"
                    disabled={saving}
                    dir="ltr"
                    required
                  />

                  <p className="text-xs text-muted-foreground">
                    تومان
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceOrg">
                    قیمت سازمانی *
                  </Label>

                  <Input
                    id="priceOrg"
                    name="priceOrg"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={formData.priceOrg}
                    onChange={handleChange}
                    placeholder="2500000"
                    disabled={saving}
                    dir="ltr"
                    required
                  />

                  <p className="text-xs text-muted-foreground">
                    تومان
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">
                ویژگی‌های محصول *
              </Label>

              <Textarea
                id="features"
                name="features"
                value={formData.features}
                onChange={handleChange}
                rows={7}
                maxLength={3000}
                placeholder={
                  'پرداخت آنلاین\nمدیریت سفارش‌ها\nپنل مدیریت\nپشتیبانی'
                }
                disabled={saving}
                required
              />

              <p className="text-xs text-muted-foreground">
                هر ویژگی را در یک خط جداگانه وارد کنید.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="demoUrl">
                لینک دمو
              </Label>

              <Input
                id="demoUrl"
                name="demoUrl"
                value={formData.demoUrl}
                onChange={handleChange}
                placeholder="https://example.com/demo"
                maxLength={2048}
                disabled={saving}
                dir="ltr"
                inputMode="url"
                autoComplete="url"
              />

              <p className="text-xs text-muted-foreground">
                در صورت نداشتن دمو، این فیلد را خالی بگذارید.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">
                لینک تصویر
              </Label>

              <Input
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="/images/telegram-bot.jpg"
                maxLength={2048}
                disabled={saving}
                dir="ltr"
              />

              <p className="text-xs text-muted-foreground">
                مسیر داخلی مانند
                {' '}
                /images/telegram-bot.jpg
                {' '}
                یا URL کامل http/https.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                وضعیت محصول *
              </Label>

              <Select
                value={formData.status}
                onValueChange={(value) => {
                  if (
                    isValidStatus(value)
                  ) {
                    setFormData((previous) => ({
                      ...previous,
                      status: value,
                    }))

                    if (error) {
                      setError('')
                    }
                  }
                }}
                disabled={saving}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="وضعیت محصول را انتخاب کنید" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="active">
                    فعال
                  </SelectItem>

                  <SelectItem value="coming-soon">
                    به‌زودی
                  </SelectItem>

                  <SelectItem value="inactive">
                    غیرفعال
                  </SelectItem>
                </SelectContent>
              </Select>

              <p className="text-xs text-muted-foreground">
                فقط محصولات فعال برای خرید در دسترس کاربران
                قرار می‌گیرند.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                انصراف
              </Button>

              <Button
                type="submit"
                disabled={saving}
              >
                {saving
                  ? 'در حال ایجاد محصول...'
                  : 'ایجاد محصول'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}