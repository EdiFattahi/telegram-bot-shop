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
const MAX_PRICE = Number.MAX_SAFE_INTEGER

function isValidStatus(value: unknown): value is ProductStatus {
  return (
    typeof value === 'string' &&
    VALID_STATUSES.includes(value as ProductStatus)
  )
}

function normalizeSlug(value: unknown): string {
  return typeof value === 'string'
    ? value.trim().toLowerCase()
    : ''
}

function parsePositiveInteger(value: unknown): number | null {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value <= 0 ||
    !Number.isSafeInteger(value) ||
    value > MAX_PRICE
  ) {
    return null
  }

  return value
}

function parseFeatures(value: unknown): string[] | null {
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

function isValidOptionalUrl(value: unknown): boolean {
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

  if (!trimmed) {
    return true
  }

  // مسیر داخلی سایت
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

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

async function requireAdmin(): Promise<boolean> {
  const user = await getCurrentUser()

  return user?.role === 'ADMIN'
}

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 401 }
      )
    }

    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        priceBase: true,
        pricePro: true,
        priceOrg: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error(
      'GET /api/admin/products error:',
      error
    )

    return NextResponse.json(
      { error: 'خطا در دریافت محصولات' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 401 }
      )
    }

    let body: unknown

    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'داده ارسالی نامعتبر است' },
        { status: 400 }
      )
    }

    if (!isObject(body)) {
      return NextResponse.json(
        { error: 'داده ارسالی نامعتبر است' },
        { status: 400 }
      )
    }

    const title =
      typeof body.title === 'string'
        ? body.title.trim()
        : ''

    const slug = normalizeSlug(body.slug)

    const shortDesc =
      typeof body.shortDesc === 'string'
        ? body.shortDesc.trim()
        : ''

    const description =
      typeof body.description === 'string'
        ? body.description.trim()
        : ''

    const priceBase = parsePositiveInteger(
      body.priceBase
    )

    const pricePro = parsePositiveInteger(
      body.pricePro
    )

    const priceOrg = parsePositiveInteger(
      body.priceOrg
    )

    const features = parseFeatures(
      body.features
    )

    const status =
      body.status === undefined
        ? 'active'
        : body.status

    const demoUrl =
      typeof body.demoUrl === 'string'
        ? body.demoUrl.trim()
        : ''

    const imageUrl =
      typeof body.imageUrl === 'string'
        ? body.imageUrl.trim()
        : ''

    // Required fields
    if (
      !title ||
      !slug ||
      !shortDesc ||
      !description
    ) {
      return NextResponse.json(
        {
          error:
            'فیلدهای ضروری را کامل کنید',
        },
        { status: 400 }
      )
    }

    // String length validation
    if (title.length > MAX_TITLE_LENGTH) {
      return NextResponse.json(
        {
          error:
            'عنوان محصول بیش از حد طولانی است',
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

    // Slug validation
    if (slug.length > MAX_SLUG_LENGTH) {
      return NextResponse.json(
        {
          error:
            'اسلاگ بیش از حد طولانی است',
        },
        { status: 400 }
      )
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return NextResponse.json(
        {
          error:
            'اسلاگ باید فقط شامل حروف انگلیسی کوچک، اعداد و خط تیره باشد',
        },
        { status: 400 }
      )
    }

    // Price validation
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

    // Features validation
    if (!features) {
      return NextResponse.json(
        {
          error:
            'ویژگی‌های محصول نامعتبر هستند',
        },
        { status: 400 }
      )
    }

    // Status validation
    if (!isValidStatus(status)) {
      return NextResponse.json(
        {
          error:
            'وضعیت محصول نامعتبر است',
        },
        { status: 400 }
      )
    }

    // URL validation
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

    // Application-level duplicate check
    const existingProduct =
      await prisma.product.findUnique({
        where: {
          slug,
        },
        select: {
          id: true,
        },
      })

    if (existingProduct) {
      return NextResponse.json(
        {
          error:
            'این اسلاگ قبلاً استفاده شده است',
        },
        { status: 409 }
      )
    }

    try {
      const product =
        await prisma.product.create({
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

      return NextResponse.json(
        product,
        { status: 201 }
      )
    } catch (error) {
      // Handle database-level unique constraint
      // in case of concurrent requests.
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        return NextResponse.json(
          {
            error:
              'این اسلاگ قبلاً استفاده شده است',
          },
          { status: 409 }
        )
      }

      throw error
    }
  } catch (error) {
    console.error(
      'POST /api/admin/products error:',
      error
    )

    return NextResponse.json(
      { error: 'خطا در ایجاد محصول' },
      { status: 500 }
    )
  }
}