import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

async function requireAdmin(): Promise<boolean> {
  const user = await getCurrentUser()

  return user?.role === 'ADMIN'
}

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    if (!id || id.length > 100) {
      return NextResponse.json(
        { error: 'شناسه پیام نامعتبر است' },
        { status: 400 }
      )
    }

    const message = await prisma.contactMessage.findUnique({
      where: {
        id,
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

    if (!message) {
      return NextResponse.json(
        { error: 'پیام موردنظر پیدا نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error(
      'GET /api/admin/contact/[id] error:',
      error
    )

    return NextResponse.json(
      { error: 'خطا در دریافت پیام' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    if (!id || id.length > 100) {
      return NextResponse.json(
        { error: 'شناسه پیام نامعتبر است' },
        { status: 400 }
      )
    }

    let body: unknown

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'داده ارسالی نامعتبر است' },
        { status: 400 }
      )
    }

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: 'داده ارسالی نامعتبر است' },
        { status: 400 }
      )
    }

    const data = body as Record<string, unknown>

    if (
      typeof data.status !== 'string' ||
      !['new', 'read', 'replied', 'archived'].includes(
        data.status
      )
    ) {
      return NextResponse.json(
        { error: 'وضعیت پیام نامعتبر است' },
        { status: 400 }
      )
    }

    const existingMessage =
      await prisma.contactMessage.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
        },
      })

    if (!existingMessage) {
      return NextResponse.json(
        { error: 'پیام موردنظر پیدا نشد' },
        { status: 404 }
      )
    }

    const updatedMessage =
      await prisma.contactMessage.update({
        where: {
          id,
        },
        data: {
          status: data.status,
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

    return NextResponse.json(updatedMessage)
  } catch (error) {
    console.error(
      'PATCH /api/admin/contact/[id] error:',
      error
    )

    return NextResponse.json(
      { error: 'خطا در بروزرسانی پیام' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    if (!id || id.length > 100) {
      return NextResponse.json(
        { error: 'شناسه پیام نامعتبر است' },
        { status: 400 }
      )
    }

    const existingMessage =
      await prisma.contactMessage.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
        },
      })

    if (!existingMessage) {
      return NextResponse.json(
        { error: 'پیام موردنظر پیدا نشد' },
        { status: 404 }
      )
    }

    await prisma.contactMessage.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(
      'DELETE /api/admin/contact/[id] error:',
      error
    )

    return NextResponse.json(
      { error: 'خطا در حذف پیام' },
      { status: 500 }
    )
  }
}