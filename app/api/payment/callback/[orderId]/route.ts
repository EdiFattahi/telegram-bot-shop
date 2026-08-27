import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = await params
    const url = new URL(req.url)
    const authority = url.searchParams.get('Authority')
    const status = url.searchParams.get('Status')

    if (status === 'OK' && authority) {
      // تایید پرداخت
      if (process.env.ZARINPAL_MERCHANT_ID) {
        const zarinpal = require('zarinpal-checkout').create(
          process.env.ZARINPAL_MERCHANT_ID,
          false
        )

        const order = await prisma.order.findUnique({
          where: { id: orderId }
        })

        if (order) {
          const verification = await zarinpal.PaymentVerification({
            Amount: order.amount,
            Authority: authority,
          })

          if (verification.status === 101 || verification.status === 100) {
            await prisma.order.update({
              where: { id: orderId },
              data: { status: 'completed' }
            })

            return NextResponse.redirect(
              `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?orderId=${orderId}`
            )
          }
        }
      }

      // حالت تست
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'completed' }
      })

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?orderId=${orderId}`
      )
    }

    // پرداخت ناموفق
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'cancelled' }
    })

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/payment/failed?orderId=${orderId}`
    )

  } catch (error) {
    console.error('Payment callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/payment/failed`
    )
  }
}