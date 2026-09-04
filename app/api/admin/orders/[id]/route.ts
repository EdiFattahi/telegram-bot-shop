import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const MAX_ORDER_ID_LENGTH = 100

function isValidOrderId(
  value: unknown
): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().length <= MAX_ORDER_ID_LENGTH
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
        {
          error: 'دسترسی غیرمجاز',
        },
        { status: 401 }
      )
    }

    const { id } = await params

    if (!isValidOrderId(id)) {
      return NextResponse.json(
        {
          error: 'شناسه سفارش نامعتبر است',
        },
        { status: 400 }
      )
    }

    const orderId = id.trim()

    const order =
      await prisma.order.findUnique({
        where: {
          id: orderId,
        },
        select: {
          id: true,
          amount: true,
          plan: true,
          status: true,
          authority: true,
          paymentRefId: true,
          paidAt: true,
          createdAt: true,
          updatedAt: true,
          telegramId: true,

          product: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },

          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })

    if (!order) {
      return NextResponse.json(
        {
          error: 'سفارش یافت نشد',
        },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error(
      'GET /api/admin/orders/[id] error:',
      error
    )

    return NextResponse.json(
      {
        error: 'خطا در دریافت اطلاعات سفارش',
      },
      { status: 500 }
    )
  }
}