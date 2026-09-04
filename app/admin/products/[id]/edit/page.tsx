'use client'

import { useEffect, useState } from 'react'
import {
  useParams,
  useRouter,
} from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import {
  Card,
  CardContent,
  CardDescription,
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

import {
  ArrowRight,
  Loader2,
  Save,
} from 'lucide-react'

const VALID_STATUSES = [
  'active',
  'coming-soon',
  'inactive',
] as const

type ProductStatus =
  (typeof VALID_STATUSES)[number]

interface ProductResponse {
  title: string
  slug: string
  description: string
  shortDesc: string
  priceBase: number
  pricePro: number
  priceOrg: number
  features: string
  demoUrl: string | null
  imageUrl: string | null
  status: string
}

interface ErrorResponse {
  error?: string
}

interface FormData {
  title: string
  slug: string
  description: string
  shortDesc: string
  priceBase: string
  pricePro: string
  priceOrg: string
  features: string
  demoUrl: string
  imageUrl: string
  status: ProductStatus
}

const INITIAL_FORM_DATA: FormData = {
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
  status: 'active',
}

function isValidStatus(
  status: string
): status is ProductStatus {
  return VALID_STATUSES.includes(
    status as ProductStatus
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

function isProductResponse(
  value: unknown
): value is ProductResponse {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false
  }

  const product =
    value as Record<string, unknown>

  return (
    typeof product.title === 'string' &&
    typeof product.slug === 'string' &&
    typeof product.description === 'string' &&
    typeof product.shortDesc === 'string' &&
    typeof product.priceBase === 'number' &&
    typeof product.pricePro === 'number' &&
    typeof product.priceOrg === 'number' &&
    typeof product.features === 'string' &&
    (product.demoUrl === null ||
      typeof product.demoUrl === 'string') &&
    (product.imageUrl === null ||
      typeof product.imageUrl === 'string') &&
    typeof product.status === 'string'
  )
}

function parseFeatures(
  value: string
): string {
  try {
    const parsed: unknown = JSON.parse(value)

    if (!Array.isArray(parsed)) {
      return ''
    }

    return parsed
      .filter(
        (item): item is string =>
          typeof item === 'string'
      )
      .map((item) => item.trim())
      .filter(Boolean)
      .join('\n')
  } catch {
    return ''
  }
}

function normalizeProduct(
  product: ProductResponse
): FormData {
  return {
    title: product.title,
    slug: product.slug,
    description: product.description,
    shortDesc: product.shortDesc,
    priceBase: String(product.priceBase),
    pricePro: String(product.pricePro),
    priceOrg: String(product.priceOrg),
    features: parseFeatures(product.features),
    demoUrl: product.demoUrl ?? '',
    imageUrl: product.imageUrl ?? '',
    status: isValidStatus(product.status)
      ? product.status
      : 'inactive',
  }
}

function isValidHttpUrl(
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

function isValidImagePath(
  value: string
): boolean {
  if (!value) {
    return true
  }

  if (value.startsWith('/')) {
    return true
  }

  return isValidHttpUrl(value)
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()

  const productId =
    typeof params.id === 'string'
      ? params.id
      : ''

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [loadError, setLoadError] =
    useState('')

  const [formData, setFormData] =
    useState<FormData>(
      INITIAL_FORM_DATA
    )

  useEffect(() => {
    if (!productId) {
      return
    }

    const controller =
      new AbortController()

    const loadProduct = async () => {
      try {
        const response = await fetch(
          `/api/admin/products/${productId}`,
          {
            cache: 'no-store',
            signal: controller.signal,
          }
        )

        const data: unknown =
          await response.json()

        if (!response.ok) {
          const message =
            isErrorResponse(data) &&
            data.error
              ? data.error
              : 'خطا در دریافت اطلاعات محصول'

          throw new Error(message)
        }

        if (!isProductResponse(data)) {
          throw new Error(
            'پاسخ سرور نامعتبر است'
          )
        }

        if (controller.signal.aborted) {
          return
        }

        setFormData(
          normalizeProduct(data)
        )
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          return
        }

        console.error(
          'Error fetching product:',
          error
        )

        if (!controller.signal.aborted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'خطا در بارگذاری اطلاعات محصول'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadProduct()

    return () => {
      controller.abort()
    }
  }, [productId])

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const {
      name,
      value,
    } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (saving) {
      return
    }

    setError('')

    if (!productId) {
      setError(
        'شناسه محصول نامعتبر است'
      )
      return
    }

    const title =
      formData.title.trim()

    const slug =
      formData.slug.trim()

    const shortDesc =
      formData.shortDesc.trim()

    const description =
      formData.description.trim()

    const priceBase =
      Number(formData.priceBase)

    const pricePro =
      Number(formData.pricePro)

    const priceOrg =
      Number(formData.priceOrg)

    const features =
      formData.features
        .split('\n')
        .map((feature) =>
          feature.trim()
        )
        .filter(Boolean)

    if (!title) {
      setError(
        'عنوان محصول را وارد کنید'
      )
      return
    }

    if (!slug) {
      setError(
        'اسلاگ محصول را وارد کنید'
      )
      return
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setError(
        'اسلاگ فقط باید شامل حروف انگلیسی کوچک، اعداد و خط تیره باشد'
      )
      return
    }

    if (!shortDesc) {
      setError(
        'توضیح کوتاه را وارد کنید'
      )
      return
    }

    if (!description) {
      setError(
        'توضیحات کامل محصول را وارد کنید'
      )
      return
    }

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

    if (features.length === 0) {
      setError(
        'حداقل یک ویژگی برای محصول وارد کنید'
      )
      return
    }

    if (!isValidStatus(formData.status)) {
      setError(
        'وضعیت محصول نامعتبر است'
      )
      return
    }

    if (
      formData.demoUrl.trim() &&
      !isValidHttpUrl(
        formData.demoUrl.trim()
      )
    ) {
      setError(
        'لینک دمو باید یک URL معتبر با http یا https باشد'
      )
      return
    }

    if (
      formData.imageUrl.trim() &&
      !isValidImagePath(
        formData.imageUrl.trim()
      )
    ) {
      setError(
        'لینک تصویر باید یک مسیر داخلی معتبر یا URL با http/https باشد'
      )
      return
    }

    setSaving(true)

    try {
      const response = await fetch(
        `/api/admin/products/${productId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type':
              'application/json',
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
            demoUrl:
              formData.demoUrl.trim(),
            imageUrl:
              formData.imageUrl.trim(),
            status: formData.status,
          }),
        }
      )

      const data: unknown =
        await response.json()

      if (!response.ok) {
        const message =
          isErrorResponse(data) &&
          data.error
            ? data.error
            : 'خطا در ویرایش محصول'

        throw new Error(message)
      }

      router.push(
        '/admin/products'
      )
      router.refresh()
    } catch (error) {
      console.error(
        'Error updating product:',
        error
      )

      setError(
        error instanceof Error
          ? error.message
          : 'خطایی رخ داد. دوباره تلاش کنید'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    if (saving) {
      return
    }

    router.push(
      '/admin/products'
    )
  }

  if (!productId) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>
              محصول نامعتبر
            </CardTitle>
            <CardDescription>
              شناسه محصول معتبر نیست.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button
              onClick={handleBack}
            >
              <ArrowRight className="ml-2 h-4 w-4" />
              بازگشت به محصولات
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <Card>
          <CardContent className="flex min-h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <Loader2 className="h-8 w-8 animate-spin" />

              <p className="text-sm text-muted-foreground">
                در حال دریافت اطلاعات محصول...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>
              دریافت اطلاعات محصول ناموفق بود
            </CardTitle>

            <CardDescription>
              اطلاعات محصول قابل بارگذاری نیست.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {loadError}
            </div>

            <Button
              variant="outline"
              onClick={handleBack}
            >
              <ArrowRight className="ml-2 h-4 w-4" />
              بازگشت به محصولات
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            ویرایش محصول
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            اطلاعات و قیمت‌های محصول را مدیریت کنید.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={saving}
        >
          <ArrowRight className="ml-2 h-4 w-4" />
          بازگشت
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            اطلاعات محصول
          </CardTitle>

          <CardDescription>
            فیلدهای ستاره‌دار الزامی هستند.
          </CardDescription>
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
                autoComplete="off"
                maxLength={200}
                disabled={saving}
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
                dir="ltr"
                autoComplete="off"
                maxLength={200}
                disabled={saving}
                required
              />

              <p className="text-xs text-muted-foreground">
                فقط حروف انگلیسی کوچک، اعداد و خط تیره.
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
                placeholder="توضیح کوتاه و جذاب درباره محصول"
                maxLength={500}
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
                placeholder="توضیحات کامل محصول..."
                rows={7}
                maxLength={5000}
                disabled={saving}
                required
              />
            </div>

            <div className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold">
                  قیمت‌گذاری
                </h2>

                <p className="text-xs text-muted-foreground">
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
                    dir="ltr"
                    disabled={saving}
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
                    dir="ltr"
                    disabled={saving}
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
                    dir="ltr"
                    disabled={saving}
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
                ویژگی‌ها *
              </Label>

              <Textarea
                id="features"
                name="features"
                value={formData.features}
                onChange={handleChange}
                placeholder={`پرداخت آنلاین
مدیریت سفارش‌ها
پنل مدیریت
پشتیبانی`}
                rows={7}
                maxLength={5000}
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
                placeholder="https://example.com"
                dir="ltr"
                inputMode="url"
                autoComplete="url"
                maxLength={2048}
                disabled={saving}
              />

              <p className="text-xs text-muted-foreground">
                در صورت وجود، URL کامل با http یا https وارد کنید.
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
                dir="ltr"
                inputMode="url"
                maxLength={2048}
                disabled={saving}
              />

              <p className="text-xs text-muted-foreground">
                مسیر داخلی مانند
                {' '}
                /images/telegram-bot.jpg
                {' '}
                یا URL کامل با http/https مجاز است.
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
                    setFormData(
                      (previous) => ({
                        ...previous,
                        status: value,
                      })
                    )

                    if (error) {
                      setError('')
                    }
                  }
                }}
                disabled={saving}
              >
                <SelectTrigger
                  id="status"
                  className="w-full"
                >
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

            <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={saving}
                className="sm:min-w-28"
              >
                انصراف
              </Button>

              <Button
                type="submit"
                disabled={saving}
                className="sm:min-w-36"
              >
                {saving ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
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
    </div>
  )
}