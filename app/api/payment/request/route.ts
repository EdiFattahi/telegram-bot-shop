import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { productId, plan } = body

    // دریافت محصول
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'محصول یافت نشد' },
        { status: 404 }
      )
    }

    // تعیین مبلغ بر اساس پلن
    let amount: number
    switch (plan) {
      case 'پایه':
        amount = product.priceBase
        break
      case 'حرفه‌ای':
        amount = product.pricePro
        break
      case 'سازمانی':
        amount = product.priceOrg
        break
      default:
        amount = product.priceBase
    }

    // ایجاد سفارش
    const order = await prisma.order.create({
      data: {
        productId,
        plan,
        amount,
        status: 'pending',
      }
    })

    // اگر زرینپال تنظیم شده
    if (process.env.ZARINPAL_MERCHANT_ID) {
      const zarinpal = require('zarinpal-checkout').create(
        process.env.ZARINPAL_MERCHANT_ID,
        false // sandbox mode
      )

      const response = await zarinpal.PaymentRequest({
        Amount: amount,
        CallbackURL: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/callback/${order.id}`,
        Description: `پرداخت سفارش ${order.id}`,
      })

      if (response.status === 100) {
        // ذخیره authority
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'processing' }
        })

        return NextResponse.json({
          success: true,
          paymentUrl: response.url,
          orderId: order.id,
        })
      }
    }

    // حالت تست (بدون درگاه)
    return NextResponse.json({
      success: true,
      testMode: true,
      orderId: order.id,
      amount,
      message: 'درگاه پرداخت تنظیم نشده است. حالت تست فعال است.'
    })

  } catch (error) {
    console.error('Payment request error:', error)
    return NextResponse.json(
      { error: 'خطا در ایجاد پرداخت' },
      { status: 500 }
    )
  }
}