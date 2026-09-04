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
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'

const VALID_STATUSES = [
  'active',
  'coming-soon',
  'inactive',
] as const

type ProductStatus = (typeof VALID_STATUSES)[number]

interface Product {
  id: string
  title: string
  slug: string
  priceBase: number
  pricePro: number
  priceOrg: number
  status: ProductStatus
  createdAt: string
  updatedAt: string
}

interface ProductApiResponse {
  id: string
  title: string
  slug: string
  priceBase: number
  pricePro: number
  priceOrg: number
  status: string
  createdAt: string
  updatedAt: string
}

function isValidStatus(
  status: string
): status is ProductStatus {
  return VALID_STATUSES.includes(
    status as ProductStatus
  )
}

function normalizeProduct(
  product: ProductApiResponse
): Product {
  return {
    ...product,
    status: isValidStatus(product.status)
      ? product.status
      : 'inactive',
  }
}

function isProductApiResponse(
  item: unknown
): item is ProductApiResponse {
  if (
    typeof item !== 'object' ||
    item === null
  ) {
    return false
  }

  const product = item as Record<string, unknown>

  return (
    typeof product.id === 'string' &&
    typeof product.title === 'string' &&
    typeof product.slug === 'string' &&
    typeof product.priceBase === 'number' &&
    typeof product.pricePro === 'number' &&
    typeof product.priceOrg === 'number' &&
    typeof product.status === 'string' &&
    typeof product.createdAt === 'string' &&
    typeof product.updatedAt === 'string'
  )
}

function getStatusLabel(
  status: ProductStatus
) {
  switch (status) {
    case 'active':
      return 'فعال'

    case 'coming-soon':
      return 'به‌زودی'

    case 'inactive':
      return 'غیرفعال'
  }
}

function getStatusClassName(
  status: ProductStatus
) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'

    case 'coming-soon':
      return 'bg-yellow-100 text-yellow-800'

    case 'inactive':
      return 'bg-gray-100 text-gray-800'
  }
}

function formatPrice(price: number) {
  return `${price.toLocaleString('fa-IR')} تومان`
}

function getErrorMessage(
  data: unknown,
  fallback: string
) {
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

async function requestProducts(
  signal?: AbortSignal
): Promise<Product[]> {
  const response = await fetch(
    '/api/admin/products',
    {
      cache: 'no-store',
      signal,
    }
  )

  const data: unknown =
    await response.json()

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        'خطا در دریافت محصولات'
      )
    )
  }

  if (!Array.isArray(data)) {
    throw new Error(
      'پاسخ سرور نامعتبر است'
    )
  }

  return data
    .filter(isProductApiResponse)
    .map(normalizeProduct)
}

export default function AdminProductsPage() {
  const [products, setProducts] =
    useState<Product[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [deletingId, setDeletingId] =
    useState<string | null>(null)

  const loadProducts =
    useCallback(
      async (
        signal?: AbortSignal
      ) => {
        try {
          const normalizedProducts =
            await requestProducts(signal)

          setProducts(
            normalizedProducts
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
            'Error fetching products:',
            error
          )

          setError(
            error instanceof Error
              ? error.message
              : 'خطا در دریافت محصولات'
          )
        }
      },
      []
    )

useEffect(() => {
  const controller = new AbortController()

  const timer = window.setTimeout(() => {
    void loadProducts(controller.signal).finally(() => {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    })
  }, 0)

  return () => {
    window.clearTimeout(timer)
    controller.abort()
  }
}, [loadProducts])

  const fetchProducts =
    async () => {
      setLoading(true)
      setError('')

      try {
        await loadProducts()
      } finally {
        setLoading(false)
      }
    }

  const handleDelete =
    async (product: Product) => {
      const confirmed =
        window.confirm(
          `آیا مطمئن هستید که می‌خواهید محصول «${product.title}» را حذف کنید؟\n\nاین عملیات قابل بازگشت نیست.`
        )

      if (!confirmed) {
        return
      }

      setDeletingId(product.id)
      setError('')

      try {
        const response =
          await fetch(
            `/api/admin/products/${product.id}`,
            {
              method: 'DELETE',
            }
          )

        const data: unknown =
          await response.json()

        if (!response.ok) {
          throw new Error(
            getErrorMessage(
              data,
              'خطا در حذف محصول'
            )
          )
        }

        setProducts(
          (currentProducts) =>
            currentProducts.filter(
              (item) =>
                item.id !== product.id
            )
        )
      } catch (error) {
        console.error(
          'Error deleting product:',
          error
        )

        setError(
          error instanceof Error
            ? error.message
            : 'خطا در حذف محصول'
        )
      } finally {
        setDeletingId(null)
      }
    }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">
          مدیریت محصولات
        </h1>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              void fetchProducts()
            }
            disabled={
              loading ||
              deletingId !== null
            }
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

          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="ml-2 h-4 w-4" />
              محصول جدید
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            لیست محصولات ({products.length})
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-8 text-center">
              در حال بارگذاری...
            </div>
          ) : products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-right">
                      عنوان
                    </th>

                    <th className="px-4 py-3 text-right">
                      اسلاگ
                    </th>

                    <th className="px-4 py-3 text-right">
                      قیمت پایه
                    </th>

                    <th className="px-4 py-3 text-right">
                      وضعیت
                    </th>

                    <th className="px-4 py-3 text-right">
                      عملیات
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {products.map(
                    (product) => {
                      const isDeleting =
                        deletingId ===
                        product.id

                      return (
                        <tr
                          key={product.id}
                          className="border-b hover:bg-muted/50"
                        >
                          <td className="px-4 py-3 font-medium">
                            {product.title}
                          </td>

                          <td className="px-4 py-3">
                            {product.slug}
                          </td>

                          <td className="px-4 py-3">
                            {formatPrice(
                              product.priceBase
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${getStatusClassName(
                                product.status
                              )}`}
                            >
                              {getStatusLabel(
                                product.status
                              )}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                disabled={
                                  deletingId !==
                                  null
                                }
                              >
                                <Link
                                  href={`/admin/products/${product.id}/edit`}
                                >
                                  <Pencil className="ml-1 h-4 w-4" />
                                  ویرایش
                                </Link>
                              </Button>

                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  void handleDelete(
                                    product
                                  )
                                }
                                disabled={
                                  deletingId !==
                                  null
                                }
                              >
                                {isDeleting ? (
                                  <>
                                    <RefreshCw className="ml-1 h-4 w-4 animate-spin" />
                                    در حال حذف...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="ml-1 h-4 w-4" />
                                    حذف
                                  </>
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    }
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />

              <p className="text-muted-foreground">
                هنوز محصولی ثبت نشده است
              </p>

              <Button asChild>
                <Link href="/admin/products/new">
                  <Plus className="ml-2 h-4 w-4" />
                  ایجاد اولین محصول
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}