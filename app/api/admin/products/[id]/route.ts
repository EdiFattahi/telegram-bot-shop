import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const VALID_STATUSES = [
  'active',
  'coming-soon',
  'inactive',
] as const

type ProductStatus = (typeof VALID_STATUSES)[number]

const MAX_TITLE_LENGTH = 200
const MAX_SHORT_DESC_LENGTH = 500
const MAX_DESCRIPTION_LENGTH = 20_000
const MAX_SLUG_LENGTH = 100
const MAX_FEATURES = 50
const MAX_FEATURE_LENGTH = 500
const MAX_URL_LENGTH = 2_000

function isValidStatus(
  value: unknown
): value is ProductStatus {
  return (
    typeof value === 'string' &&
    VALID_STATUSES.includes(
      value as ProductStatus
    )
  )
}

function normalizeSlug(value: unknown): string {
  return typeof value === 'string'
    ? value.trim().toLowerCase()
    : ''
}

function parsePositiveInteger(
  value: unknown
): number | null {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value <= 0 ||
    !Number.isSafeInteger(value)
  ) {
    return null
  }

  return value
}

function parseFeatures(
  value: unknown
): string[] | null {
  if (!Array.isArray(value)) {
    return null
  }

  if (value.length === 0 || value.length > MAX_FEATURES) {
    return null
  }

  const features: string[] = []

  for (const item of value) {
    if (typeof item !== 'string') {
      return null
    }

    const feature = item.trim()

    if (
      !feature ||
      feature.length > MAX_FEATURE_LENGTH
    ) {
      return null
    }

    features.push(feature)
  }

  return features
}

function isValidOptionalUrl(
  value: unknown
): boolean {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return true
  }

  if (typeof value !== 'string') {
    return false
  }

  const trimmed = value.trim()

  if (trimmed.length > MAX_URL_LENGTH) {
    return false
  }

  /*
   * مسیر داخلی سایت، مانند:
   * /images/telegram-bot.jpg
   */
  if (trimmed.startsWith('/')) {
    return /^\/[a-zA-Z0-9/_\-.]+$/.test(trimmed)
  }

  try {
    const url = new URL(trimmed)

    return (
      (url.protocol === 'http:' ||
        url.protocol === 'https:') &&
      Boolean(url.hostname)
    )
  } catch {
    return false
  }
}

function isValidProductId(
  value: unknown
): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().length <= 100
  )
}

async function requireAdmin(): Promise<boolean> {
  const user = await getCurrentUser()

  return user?.role === 'ADMIN'
}

export async function GET(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 401 }
      )
    }

    const { id } = await params

    if (!isValidProductId(id)) {
      return NextResponse.json(
        {
          error: 'شناسه محصول نامعتبر است',
        },
        { status: 400 }
      )
    }

    const product =
      await prisma.product.findUnique({
        where: {
          id: id.trim(),
        },
      })

    if (!product) {
      return NextResponse.json(
        {
          error: 'محصول یافت نشد',
        },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error(
      'Error fetching product:',
      error
    )

    return NextResponse.json(
      {
        error: 'خطا در دریافت محصول',
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 401 }
      )
    }

    const { id } = await params

    if (!isValidProductId(id)) {
      return NextResponse.json(
        {
          error: 'شناسه محصول نامعتبر است',
        },
        { status: 400 }
      )
    }

    const productId = id.trim()

    let body: unknown

    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        {
          error: 'داده ارسالی نامعتبر است',
        },
        { status: 400 }
      )
    }

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          error: 'داده ارسالی نامعتبر است',
        },
        { status: 400 }
      )
    }

    const data =
      body as Record<string, unknown>

    const title =
      typeof data.title === 'string'
        ? data.title.trim()
        : ''

    const slug = normalizeSlug(data.slug)

    const shortDesc =
      typeof data.shortDesc === 'string'
        ? data.shortDesc.trim()
        : ''

    const description =
      typeof data.description === 'string'
        ? data.description.trim()
        : ''

    const priceBase =
      parsePositiveInteger(data.priceBase)

    const pricePro =
      parsePositiveInteger(data.pricePro)

    const priceOrg =
      parsePositiveInteger(data.priceOrg)

    const features =
      parseFeatures(data.features)

    const demoUrl =
      typeof data.demoUrl === 'string'
        ? data.demoUrl.trim()
        : ''

    const imageUrl =
      typeof data.imageUrl === 'string'
        ? data.imageUrl.trim()
        : ''

    if (!isValidStatus(data.status)) {
      return NextResponse.json(
        {
          error: 'وضعیت محصول نامعتبر است',
        },
        { status: 400 }
      )
    }

    const status: ProductStatus =
      data.status

    if (
      !title ||
      !slug ||
      !shortDesc ||
      !description
    ) {
      return NextResponse.json(
        {
          error: 'فیلدهای ضروری را کامل کنید',
        },
        { status: 400 }
      )
    }

    if (title.length > MAX_TITLE_LENGTH) {
      return NextResponse.json(
        {
          error: 'عنوان محصول بیش از حد طولانی است',
        },
        { status: 400 }
      )
    }

    if (
      shortDesc.length >
      MAX_SHORT_DESC_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            'توضیح کوتاه بیش از حد طولانی است',
        },
        { status: 400 }
      )
    }

    if (
      description.length >
      MAX_DESCRIPTION_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            'توضیحات محصول بیش از حد طولانی است',
        },
        { status: 400 }
      )
    }

    if (slug.length > MAX_SLUG_LENGTH) {
      return NextResponse.json(
        {
          error: 'اسلاگ بیش از حد طولانی است',
        },
        { status: 400 }
      )
    }

    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
        slug
      )
    ) {
      return NextResponse.json(
        {
          error:
            'اسلاگ باید فقط شامل حروف انگلیسی کوچک، اعداد و خط تیره باشد',
        },
        { status: 400 }
      )
    }

    if (
      priceBase === null ||
      pricePro === null ||
      priceOrg === null
    ) {
      return NextResponse.json(
        {
          error:
            'قیمت‌ها باید عدد صحیح بزرگ‌تر از صفر باشند',
        },
        { status: 400 }
      )
    }

    if (!features) {
      return NextResponse.json(
        {
          error:
            'حداقل یک و حداکثر ۵۰ ویژگی معتبر برای محصول وارد کنید',
        },
        { status: 400 }
      )
    }

    if (!isValidOptionalUrl(demoUrl)) {
      return NextResponse.json(
        {
          error: 'لینک دمو نامعتبر است',
        },
        { status: 400 }
      )
    }

    if (!isValidOptionalUrl(imageUrl)) {
      return NextResponse.json(
        {
          error: 'لینک تصویر نامعتبر است',
        },
        { status: 400 }
      )
    }

    const existingProduct =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },
        select: {
          id: true,
        },
      })

    if (!existingProduct) {
      return NextResponse.json(
        {
          error: 'محصول یافت نشد',
        },
        { status: 404 }
      )
    }

    const duplicateSlug =
      await prisma.product.findFirst({
        where: {
          slug,
          NOT: {
            id: productId,
          },
        },
        select: {
          id: true,
        },
      })

    if (duplicateSlug) {
      return NextResponse.json(
        {
          error:
            'این اسلاگ قبلاً توسط محصول دیگری استفاده شده است',
        },
        { status: 409 }
      )
    }

    try {
      const product =
        await prisma.product.update({
          where: {
            id: productId,
          },
          data: {
            title,
            slug,
            description,
            shortDesc,
            priceBase,
            pricePro,
            priceOrg,
            features:
              JSON.stringify(features),
            demoUrl: demoUrl || null,
            imageUrl: imageUrl || null,
            status,
          },
        })

      return NextResponse.json(product)
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        return NextResponse.json(
          {
            error:
              'این اسلاگ قبلاً توسط محصول دیگری استفاده شده است',
          },
          { status: 409 }
        )
      }

      throw error
    }
  } catch (error) {
    console.error(
      'Error updating product:',
      error
    )

    return NextResponse.json(
      {
        error: 'خطا در ویرایش محصول',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 401 }
      )
    }

    const { id } = await params

    if (!isValidProductId(id)) {
      return NextResponse.json(
        {
          error: 'شناسه محصول نامعتبر است',
        },
        { status: 400 }
      )
    }

    const productId = id.trim()

    const existingProduct =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },
        select: {
          id: true,
        },
      })

    if (!existingProduct) {
      return NextResponse.json(
        {
          error: 'محصول یافت نشد',
        },
        { status: 404 }
      )
    }

    const orderCount =
      await prisma.order.count({
        where: {
          productId,
        },
      })

    if (orderCount > 0) {
      return NextResponse.json(
        {
          error:
            'این محصول دارای سفارش است و قابل حذف نیست. برای خارج کردن محصول از فروش، وضعیت آن را روی inactive قرار دهید.',
        },
        { status: 409 }
      )
    }

    await prisma.product.delete({
      where: {
        id: productId,
      },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(
      'Error deleting product:',
      error
    )

    return NextResponse.json(
      {
        error: 'خطا در حذف محصول',
      },
      { status: 500 }
    )
  }
}