import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { tomanToRial } from '@/lib/payment'
import ZarinpalCheckout from 'zarinpal-checkout'

function getSiteUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (!siteUrl) {
    throw new Error(
      'NEXT_PUBLIC_SITE_URL is not configured'
    )
  }

  try {
    const url = new URL(siteUrl)

    if (
      url.protocol !== 'http:' &&
      url.protocol !== 'https:'
    ) {
      throw new Error(
        'NEXT_PUBLIC_SITE_URL must use HTTP or HTTPS'
      )
    }

    return url.origin
  } catch {
    throw new Error(
      'NEXT_PUBLIC_SITE_URL is invalid'
    )
  }
}

function redirectToPaymentResult(
  siteUrl: string,
  success: boolean,
  orderId?: string
): NextResponse {
  const path = success
    ? '/payment/success'
    : '/payment/failed'

  const url = new URL(path, siteUrl)

  if (orderId) {
    url.searchParams.set(
      'orderId',
      orderId
    )
  }

  return NextResponse.redirect(url)
}

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ orderId: string }>
  }
) {
  let siteUrl: string

  try {
    siteUrl = getSiteUrl()
  } catch (error) {
    console.error(
      'Payment callback configuration error:',
      error instanceof Error
        ? error.message
        : error
    )

    return NextResponse.json(
      {
        error:
          'تنظیمات پرداخت ناقص است',
      },
      {
        status: 500,
      }
    )
  }

  try {
    const { orderId } = await params
    const url = new URL(req.url)

    const authority =
      url.searchParams.get('Authority')

    const status =
      url.searchParams.get('Status')

    // ============================================================
    // اعتبارسنجی Order ID
    // ============================================================

    if (!orderId) {
      return redirectToPaymentResult(
        siteUrl,
        false
      )
    }

    // ============================================================
    // دریافت Order
    // ============================================================

    const order =
      await prisma.order.findUnique({
        where: {
          id: orderId,
        },
        select: {
          id: true,
          amount: true,
          status: true,
          authority: true,
          paymentRefId: true,
          paidAt: true,
        },
      })

    if (!order) {
      return redirectToPaymentResult(
        siteUrl,
        false
      )
    }

    // ============================================================
    // Idempotency
    // ============================================================

    if (order.status === 'completed') {
      return redirectToPaymentResult(
        siteUrl,
        true,
        order.id
      )
    }

    // ============================================================
    // فقط Order در وضعیت processing قابل Verification است.
    // ============================================================

    if (order.status !== 'processing') {
      console.warn(
        `Payment callback ignored for order ${order.id}. Current status: ${order.status}`
      )

      return redirectToPaymentResult(
        siteUrl,
        false,
        order.id
      )
    }

    // ============================================================
    // Callback ناموفق
    //
    // نکته امنیتی:
    // Callback با Status ناموفق نباید Order را cancelled کند.
    // چون پارامترهای Callback توسط Client قابل ارسال هستند.
    // ============================================================

    if (
      status !== 'OK' ||
      !authority
    ) {
      console.warn(
        `Payment callback was not successful for order ${order.id}`
      )

      return redirectToPaymentResult(
        siteUrl,
        false,
        order.id
      )
    }

    // ============================================================
    // Merchant ID
    // ============================================================

    const merchantId =
      process.env.ZARINPAL_MERCHANT_ID

    if (!merchantId) {
      console.error(
        'Payment callback: ZARINPAL_MERCHANT_ID is not configured'
      )

      return redirectToPaymentResult(
        siteUrl,
        false,
        order.id
      )
    }

    // ============================================================
    // Authority باید با Authority ذخیره‌شده برابر باشد.
    //
    // نکته امنیتی:
    // Authority اشتباه نباید Order را cancelled کند.
    // ============================================================

    if (!order.authority) {
      console.error(
        `Payment callback: order ${order.id} has no stored authority`
      )

      return redirectToPaymentResult(
        siteUrl,
        false,
        order.id
      )
    }

    if (order.authority !== authority) {
      console.warn(
        `Payment callback authority mismatch for order ${order.id}`
      )

      return redirectToPaymentResult(
        siteUrl,
        false,
        order.id
      )
    }

    // ============================================================
    // محاسبه مبلغ واقعی از Database
    //
    // Database = تومان
    // ZarinPal = ریال
    // ============================================================

    let amountRial: number

    try {
      amountRial = tomanToRial(
        order.amount
      )
    } catch (error) {
      console.error(
        `Payment callback amount conversion failed for order ${order.id}:`,
        error
      )

      return redirectToPaymentResult(
        siteUrl,
        false,
        order.id
      )
    }

    if (
      !Number.isSafeInteger(amountRial) ||
      amountRial <= 0
    ) {
      console.error(
        `Payment callback invalid amount for order ${order.id}: ${amountRial}`
      )

      return redirectToPaymentResult(
        siteUrl,
        false,
        order.id
      )
    }

    // ============================================================
    // Verification
    // ============================================================

    const zarinpal =
      ZarinpalCheckout.create(
        merchantId,
        false
      )

    let verification

    try {
      verification =
        await zarinpal.PaymentVerification({
          Amount: amountRial,
          Authority: authority,
        })
    } catch (error) {
      console.error(
        `Payment verification request failed for order ${order.id}:`,
        error
      )

      // در صورت خطای ارتباطی با درگاه،
      // Order را cancelled نمی‌کنیم.
      //
      // ممکن است پرداخت واقعاً انجام شده باشد.
      // این Order باید برای Retry / reconciliation
      // در وضعیت processing باقی بماند.

      return redirectToPaymentResult(
        siteUrl,
        false,
        order.id
      )
    }

    // ============================================================
    // پرداخت موفق
    // ============================================================

    if (
      verification.status === 100 ||
      verification.status === 101
    ) {
      const paymentRefId =
        verification.refId != null
          ? String(verification.refId)
          : null

      const updatedOrder =
        await prisma.order.updateMany({
          where: {
            id: order.id,
            status: 'processing',
            authority,
          },
          data: {
            status: 'completed',
            paymentRefId,
            paidAt:
              order.paidAt ?? new Date(),
          },
        })

      if (updatedOrder.count === 1) {
        return redirectToPaymentResult(
          siteUrl,
          true,
          order.id
        )
      }

      // ممکن است Callback همزمان دیگری
      // قبلاً Order را تکمیل کرده باشد.
      const currentOrder =
        await prisma.order.findUnique({
          where: {
            id: order.id,
          },
          select: {
            status: true,
          },
        })

      if (
        currentOrder?.status === 'completed'
      ) {
        return redirectToPaymentResult(
          siteUrl,
          true,
          order.id
        )
      }

      console.error(
        `Payment finalization failed for order ${order.id}`
      )

      return redirectToPaymentResult(
        siteUrl,
        false,
        order.id
      )
    }

    // ============================================================
    // Verification ناموفق
    //
    // فقط در این مرحله که پاسخ واقعی Verification
    // از درگاه دریافت شده، Order را cancelled می‌کنیم.
    // ============================================================

    console.error(
      `Payment verification failed for order ${order.id}. Status: ${verification.status}`
    )

    await prisma.order.updateMany({
      where: {
        id: order.id,
        status: 'processing',
        authority,
      },
      data: {
        status: 'cancelled',
      },
    })

    return redirectToPaymentResult(
      siteUrl,
      false,
      order.id
    )
  } catch (error) {
    console.error(
      'Payment callback error:',
      error instanceof Error
        ? error.message
        : error
    )

    try {
      return redirectToPaymentResult(
        getSiteUrl(),
        false
      )
    } catch {
      return NextResponse.json(
        {
          error:
            'خطا در پردازش callback پرداخت',
        },
        {
          status: 500,
        }
      )
    }
  }
}