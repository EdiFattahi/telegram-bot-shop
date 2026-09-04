import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const VALID_STATUSES = [
  'new',
  'read',
  'replied',
  'archived',
] as const

type ContactMessageStatus = (typeof VALID_STATUSES)[number]

async function requireAdmin(): Promise<boolean> {
  const user = await getCurrentUser()

  return user?.role === 'ADMIN'
}

function isValidStatus(
  value: unknown
): value is ContactMessageStatus {
  return (
    typeof value === 'string' &&
    VALID_STATUSES.includes(
      value as ContactMessageStatus
    )
  )
}

function getIdFromParams(
  params: { id: string }
): string | null {
  const id = params.id?.trim()

  return id || null
}

// ============================================================
// GET /api/admin/contact/[id]
// دریافت جزئیات یک پیام
// ============================================================

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ==========================================================
    // Authorization
    // ==========================================================

    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 401 }
      )
    }

    // ==========================================================
    // Params
    // ==========================================================

    const resolvedParams = await params
    const id = getIdFromParams(resolvedParams)

    if (!id) {
      return NextResponse.json(
        { error: 'شناسه پیام نامعتبر است' },
        { status: 400 }
      )
    }

    // ==========================================================
    // Find message
    // ==========================================================

    const message =
      await prisma.contactMessage.findUnique({
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
      {
        error: 'خطا در دریافت پیام',
      },
      { status: 500 }
    )
  }
}

// ============================================================
// PATCH /api/admin/contact/[id]
// تغییر وضعیت پیام
// ============================================================

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ==========================================================
    // Authorization
    // ==========================================================

    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 401 }
      )
    }

    // ==========================================================
    // Params
    // ==========================================================

    const resolvedParams = await params
    const id = getIdFromParams(resolvedParams)

    if (!id) {
      return NextResponse.json(
        { error: 'شناسه پیام نامعتبر است' },
        { status: 400 }
      )
    }

    // ==========================================================
    // Parse JSON
    // ==========================================================

    let body: unknown

    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        {
          error: 'داده ارسالی نامعتبر است',
        },
        { status: 400 }
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
        { status: 400 }
      )
    }

    const data =
      body as Record<string, unknown>

    // ==========================================================
    // Validate status
    // ==========================================================

    if (!isValidStatus(data.status)) {
      return NextResponse.json(
        {
          error:
            'وضعیت پیام نامعتبر است',
        },
        { status: 400 }
      )
    }

    // ==========================================================
    // Check message exists
    // ==========================================================

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
        {
          error: 'پیام موردنظر پیدا نشد',
        },
        { status: 404 }
      )
    }

    // ==========================================================
    // Update status
    // ==========================================================

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
      {
        error: 'خطا در به‌روزرسانی وضعیت پیام',
      },
      { status: 500 }
    )
  }
}