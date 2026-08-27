import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    // بررسی احراز هویت
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 401 }
      )
    }

    const body = await req.json()

    // اعتبارسنجی
    if (!body.title || !body.slug || !body.priceBase) {
      return NextResponse.json(
        { error: 'فیلدهای ضروری را پر کنید' },
        { status: 400 }
      )
    }

    // بررسی تکراری بودن slug
    const existingProduct = await prisma.product.findUnique({
      where: { slug: body.slug }
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: 'این اسلاگ قبلاً استفاده شده است' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        title: body.title,
        slug: body.slug,
        description: body.description,
        shortDesc: body.shortDesc,
        priceBase: body.priceBase,
        pricePro: body.pricePro,
        priceOrg: body.priceOrg,
        features: JSON.stringify(body.features),
        demoUrl: body.demoUrl || null,
        imageUrl: body.imageUrl || null,
        status: body.status || 'active',
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'خطا در ایجاد محصول' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت محصولات' },
      { status: 500 }
    )
  }
}