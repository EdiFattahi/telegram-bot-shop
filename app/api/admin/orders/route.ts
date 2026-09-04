import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

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

    const orders = await prisma.order.findMany({
      orderBy: {
        createdAt: 'desc',
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
            title: true,
            slug: true,
          },
        },

        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error(
      'GET /api/admin/orders error:',
      error
    )

    return NextResponse.json(
      { error: 'خطا در دریافت سفارشات' },
      { status: 500 }
    )
  }
}