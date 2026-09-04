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

    const messages = await prisma.contactMessage.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error(
      'GET /api/admin/contact error:',
      error
    )

    return NextResponse.json(
      { error: 'خطا در دریافت پیام‌های تماس' },
      { status: 500 }
    )
  }
}