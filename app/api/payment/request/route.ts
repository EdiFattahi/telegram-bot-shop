import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { tomanToRial } from '@/lib/payment'
import ZarinpalCheckout from 'zarinpal-checkout'

const VALID_PLANS = [
  'پایه',
  'حرفه‌ای',
  'سازمانی',
] as const

type PlanName = (typeof VALID_PLANS)[number]

function isValidPlan(
  value: unknown
): value is PlanName {
  return (
    typeof value === 'string' &&
    VALID_PLANS.includes(value as PlanName)
  )
}

function getPlanPrice(
  product: {
    priceBase: number
    pricePro: number
    priceOrg: number
  },
  plan: PlanName
): number {
  switch (plan) {
    case 'پایه':
      return product.priceBase

    case 'حرفه‌ای':
      return product.pricePro

    case 'سازمانی':
      return product.priceOrg
  }
}

function isValidSiteUrl(
  value: string
): boolean {
  try {
    const url = new URL(value)

    if (
      url.protocol !== 'http:' &&
      url.protocol !== 'https:'
    ) {
      return false
    }

    return true
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  let orderId: string | null = null

  try {
    // ============================================================
    // دریافت و اعتبارسنجی Body
    // ============================================================

    let body: unknown

    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        {
          error: 'داده ارسالی نامعتبر است',
        },
        {
          status: 400,
        }
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
        {
          status: 400,
        }
      )
    }

    const data =
      body as Record<string, unknown>

    const productId =
      typeof data.productId === 'string'
        ? data.productId.trim()
        : ''

    const plan =
      typeof data.plan === 'string'
        ? data.plan.trim()
        : ''

    if (!productId || !isValidPlan(plan)) {
      return NextResponse.json(
        {
          error: 'اطلاعات سفارش نامعتبر است',
        },
        {
          status: 400,
        }
      )
    }

    // ============================================================
    // دریافت Product از Database
    //
    // قیمت هرگز از Client پذیرفته نمی‌شود.
    // ============================================================

    const product =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },
        select: {
          id: true,
          title: true,
          priceBase: true,
          pricePro: true,
          priceOrg: true,
          status: true,
        },
      })

    if (!product) {
      return NextResponse.json(
        {
          error: 'محصول یافت نشد',
        },
        {
          status: 404,
        }
      )
    }

    // ============================================================
    // فقط Product فعال قابل خرید است
    // ============================================================

    if (product.status !== 'active') {
      return NextResponse.json(
        {
          error:
            'این محصول در حال حاضر قابل خرید نیست',
        },
        {
          status: 400,
        }
      )
    }

    // ============================================================
    // تعیین قیمت واقعی از Database
    // ============================================================

    const amountToman = getPlanPrice(
      product,
      plan
    )

    if (
      !Number.isSafeInteger(amountToman) ||
      amountToman <= 0
    ) {
      console.error(
        'Invalid product price:',
        {
          productId: product.id,
          plan,
          amountToman,
        }
      )

      return NextResponse.json(
        {
          error: 'مبلغ محصول نامعتبر است',
        },
        {
          status: 400,
        }
      )
    }

    // ============================================================
    // تبدیل تومان → ریال
    // ============================================================

    let amountRial: number

    try {
      amountRial = tomanToRial(amountToman)
    } catch (error) {
      console.error(
        'Amount conversion error:',
        error
      )

      return NextResponse.json(
        {
          error: 'خطا در محاسبه مبلغ پرداخت',
        },
        {
          status: 500,
        }
      )
    }

    if (
      !Number.isSafeInteger(amountRial) ||
      amountRial <= 0
    ) {
      console.error(
        'Invalid rial amount:',
        {
          productId: product.id,
          plan,
          amountToman,
          amountRial,
        }
      )

      return NextResponse.json(
        {
          error: 'مبلغ پرداخت نامعتبر است',
        },
        {
          status: 500,
        }
      )
    }

    // ============================================================
    // بررسی تنظیمات درگاه
    // ============================================================

    const merchantId =
      process.env.ZARINPAL_MERCHANT_ID

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL

    if (!merchantId) {
      console.error(
        'ZARINPAL_MERCHANT_ID is not configured'
      )

      return NextResponse.json(
        {
          error:
            'درگاه پرداخت در حال حاضر در دسترس نیست',
        },
        {
          status: 503,
        }
      )
    }

    if (
      !siteUrl ||
      !isValidSiteUrl(siteUrl)
    ) {
      console.error(
        'NEXT_PUBLIC_SITE_URL is missing or invalid'
      )

      return NextResponse.json(
        {
          error:
            'تنظیمات آدرس پرداخت ناقص است',
        },
        {
          status: 500,
        }
      )
    }

    // ============================================================
    // ایجاد Order
    //
    // مبلغ ذخیره‌شده در Database = تومان
    // ============================================================

    const order =
      await prisma.order.create({
        data: {
          productId: product.id,
          plan,
          amount: amountToman,
          status: 'pending',
        },
        select: {
          id: true,
          amount: true,
          status: true,
        },
      })

    orderId = order.id

    // ============================================================
    // ایجاد Payment Request در زرین‌پال
    // ============================================================

    const zarinpal =
      ZarinpalCheckout.create(
        merchantId,
        false
      )

    const callbackUrl =
      `${siteUrl.replace(/\/+$/, '')}` +
      `/api/payment/callback/${order.id}`

    let response

    try {
      response =
        await zarinpal.PaymentRequest({
          Amount: amountRial,
          CallbackURL: callbackUrl,
          Description:
            `پرداخت سفارش ${order.id}`,
        })
    } catch (error) {
      console.error(
        'ZarinPal PaymentRequest error:',
        error
      )

      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: 'cancelled',
        },
      })

      return NextResponse.json(
        {
          error:
            'ارتباط با درگاه پرداخت برقرار نشد',
        },
        {
          status: 502,
        }
      )
    }

    // ============================================================
    // بررسی پاسخ زرین‌پال
    // ============================================================

    if (
      response.status === 100 &&
      response.authority
    ) {
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          authority: response.authority,
          status: 'processing',
        },
      })

      return NextResponse.json({
        success: true,
        paymentUrl: response.url,
        orderId: order.id,
      })
    }

    // ============================================================
    // Payment Request رد شده است
    // ============================================================

    console.error(
      'ZarinPal PaymentRequest failed:',
      {
        orderId: order.id,
        status: response.status,
      }
    )

    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: 'cancelled',
      },
    })

    return NextResponse.json(
      {
        error:
          'خطا در ایجاد درخواست پرداخت',
      },
      {
        status: 502,
      }
    )
  } catch (error) {
    console.error(
      'Payment request error:',
      error instanceof Error
        ? error.message
        : error
    )

    // اگر Order ایجاد شده ولی خطای غیرمنتظره
    // رخ داده است، آن را در وضعیت cancelled قرار می‌دهیم.
    if (orderId) {
      try {
        await prisma.order.update({
          where: {
            id: orderId,
          },
          data: {
            status: 'cancelled',
          },
        })
      } catch (updateError) {
        console.error(
          'Failed to cancel order after payment error:',
          updateError
        )
      }
    }

    return NextResponse.json(
      {
        error: 'خطا در ایجاد پرداخت',
      },
      {
        status: 500,
      }
    )
  }
}