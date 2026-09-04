import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { tomanToRial } from '@/lib/payment'
import { getCurrentUser } from '@/lib/auth'
import ZarinpalCheckout from 'zarinpal-checkout'

async function requireAdmin(): Promise<boolean> {
  const user = await getCurrentUser()

  return user?.role === 'ADMIN'
}

export async function POST(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  try {
    // ============================================================
    // Authentication / Authorization
    // ============================================================

    if (!(await requireAdmin())) {
      return NextResponse.json(
        {
          error: 'دسترسی غیرمجاز',
        },
        {
          status: 401,
        }
      )
    }

    // ============================================================
    // دریافت Order ID
    // ============================================================

    const { id } = await params

    const orderId =
      typeof id === 'string'
        ? id.trim()
        : ''

    if (!orderId) {
      return NextResponse.json(
        {
          error: 'شناسه سفارش نامعتبر است',
        },
        {
          status: 400,
        }
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
      return NextResponse.json(
        {
          error: 'سفارش یافت نشد',
        },
        {
          status: 404,
        }
      )
    }

    // ============================================================
    // Idempotency
    //
    // اگر Order قبلاً تکمیل شده باشد،
    // Verification مجدد انجام نمی‌دهیم.
    // ============================================================

    if (order.status === 'completed') {
      return NextResponse.json({
        success: true,
        status: 'completed',
        alreadyCompleted: true,
        message: 'این سفارش قبلاً پرداخت شده است',
        order: {
          id: order.id,
          status: order.status,
          paymentRefId: order.paymentRefId,
          paidAt: order.paidAt,
        },
      })
    }

    // ============================================================
    // فقط Order در وضعیت processing قابل Verification است.
    // ============================================================

    if (order.status !== 'processing') {
      return NextResponse.json(
        {
          error:
            'فقط سفارش‌های در وضعیت پردازش قابل بررسی مجدد پرداخت هستند',
          status: order.status,
        },
        {
          status: 409,
        }
      )
    }

    // ============================================================
    // Authority
    // ============================================================

    if (!order.authority) {
      return NextResponse.json(
        {
          error:
            'شناسه پرداخت برای این سفارش ثبت نشده است',
        },
        {
          status: 409,
        }
      )
    }

    // ============================================================
    // Merchant ID
    // ============================================================

    const merchantId =
      process.env.ZARINPAL_MERCHANT_ID

    if (!merchantId) {
      console.error(
        'Admin payment verification: ZARINPAL_MERCHANT_ID is not configured'
      )

      return NextResponse.json(
        {
          error:
            'تنظیمات درگاه پرداخت ناقص است',
        },
        {
          status: 503,
        }
      )
    }

    // ============================================================
    // تبدیل تومان → ریال
    //
    // مقدار Order در Database بر حسب تومان است.
    // زرین‌پال مبلغ را بر حسب ریال دریافت می‌کند.
    // ============================================================

    let amountRial: number

    try {
      amountRial = tomanToRial(
        order.amount
      )
    } catch (error) {
      console.error(
        `Admin payment verification amount conversion failed for order ${order.id}:`,
        error
      )

      return NextResponse.json(
        {
          error:
            'خطا در محاسبه مبلغ پرداخت',
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
        `Admin payment verification invalid amount for order ${order.id}: ${amountRial}`
      )

      return NextResponse.json(
        {
          error:
            'مبلغ پرداخت نامعتبر است',
        },
        {
          status: 500,
        }
      )
    }

    // ============================================================
    // ZarinPal Verification
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
          Authority: order.authority,
        })
    } catch (error) {
      console.error(
        `Admin payment verification request failed for order ${order.id}:`,
        error
      )

      // در صورت خطای ارتباطی:
      // Order همچنان processing باقی می‌ماند.
      //
      // چون ممکن است پرداخت واقعاً انجام شده باشد
      // ولی Verification به علت مشکل شبکه پاسخ نداده باشد.

      return NextResponse.json(
        {
          success: false,
          retryable: true,
          status: 'processing',
          error:
            'ارتباط با درگاه پرداخت برقرار نشد. سفارش همچنان در وضعیت پردازش باقی ماند.',
        },
        {
          status: 502,
        }
      )
    }

    // ============================================================
    // Verification موفق
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
            authority: order.authority,
          },
          data: {
            status: 'completed',
            paymentRefId,
            paidAt:
              order.paidAt ?? new Date(),
          },
        })

      // ==========================================================
      // Update موفق
      // ==========================================================

      if (updatedOrder.count === 1) {
        const completedOrder =
          await prisma.order.findUnique({
            where: {
              id: order.id,
            },
            select: {
              id: true,
              status: true,
              amount: true,
              authority: true,
              paymentRefId: true,
              paidAt: true,
              updatedAt: true,
            },
          })

        return NextResponse.json({
          success: true,
          status: 'completed',
          message:
            'پرداخت با موفقیت تأیید و سفارش تکمیل شد',
          order: completedOrder,
        })
      }

      // ==========================================================
      // احتمال Callback همزمان
      // ==========================================================

      const currentOrder =
        await prisma.order.findUnique({
          where: {
            id: order.id,
          },
          select: {
            id: true,
            status: true,
            paymentRefId: true,
            paidAt: true,
            updatedAt: true,
          },
        })

      if (
        currentOrder?.status === 'completed'
      ) {
        return NextResponse.json({
          success: true,
          status: 'completed',
          alreadyCompleted: true,
          message:
            'پرداخت قبلاً توسط درخواست دیگری تکمیل شده است',
          order: currentOrder,
        })
      }

      console.error(
        `Admin payment verification finalization failed for order ${order.id}`
      )

      return NextResponse.json(
        {
          error:
            'تأیید پرداخت انجام شد اما تکمیل سفارش ناموفق بود',
        },
        {
          status: 500,
        }
      )
    }

    // ============================================================
    // Verification ناموفق
    // ============================================================

    const cancelledOrder =
      await prisma.order.updateMany({
        where: {
          id: order.id,
          status: 'processing',
          authority: order.authority,
        },
        data: {
          status: 'cancelled',
        },
      })

    if (cancelledOrder.count === 1) {
      return NextResponse.json({
        success: false,
        retryable: false,
        status: 'cancelled',
        message:
          'پرداخت تأیید نشد و سفارش لغو شد',
        order: {
          id: order.id,
          status: 'cancelled',
        },
      })
    }

    // ============================================================
    // احتمال تغییر همزمان وضعیت Order
    // ============================================================

    const currentOrder =
      await prisma.order.findUnique({
        where: {
          id: order.id,
        },
        select: {
          id: true,
          status: true,
          paymentRefId: true,
          paidAt: true,
        },
      })

    if (
      currentOrder?.status === 'completed'
    ) {
      return NextResponse.json({
        success: true,
        status: 'completed',
        alreadyCompleted: true,
        message:
          'پرداخت همزمان توسط درخواست دیگری تکمیل شده است',
        order: currentOrder,
      })
    }

    return NextResponse.json(
      {
        error:
          'وضعیت سفارش هنگام تأیید پرداخت تغییر کرده است',
        status:
          currentOrder?.status ?? null,
      },
      {
        status: 409,
      }
    )
  } catch (error) {
    console.error(
      'POST /api/admin/orders/[id]/verify-payment error:',
      error instanceof Error
        ? error.message
        : error
    )

    return NextResponse.json(
      {
        error:
          'خطا در بررسی مجدد پرداخت',
      },
      {
        status: 500,
      }
    )
  }
}
