import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 128
const MAX_NAME_LENGTH = 100

const VALID_ROLES = ['USER', 'ADMIN'] as const
type UserRole = (typeof VALID_ROLES)[number]

async function requireAdmin(): Promise<boolean> {
  const user = await getCurrentUser()

  return user?.role === 'ADMIN'
}

function isValidRole(
  value: unknown
): value is UserRole {
  return (
    typeof value === 'string' &&
    VALID_ROLES.includes(value as UserRole)
  )
}

function isValidEmail(
  value: unknown
): value is string {
  if (typeof value !== 'string') {
    return false
  }

  const email = value.trim()

  if (!email || email.length > 254) {
    return false
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  )
}

function isValidName(
  value: unknown
): value is string {
  if (typeof value !== 'string') {
    return false
  }

  const name = value.trim()

  return (
    name.length > 0 &&
    name.length <= MAX_NAME_LENGTH
  )
}

function isValidPassword(
  value: unknown
): value is string {
  return (
    typeof value === 'string' &&
    value.length >= MIN_PASSWORD_LENGTH &&
    value.length <= MAX_PASSWORD_LENGTH
  )
}

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 401 }
      )
    }

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,

        _count: {
          select: {
            orders: true,
          },
        },
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error(
      'GET /api/admin/users error:',
      error
    )

    return NextResponse.json(
      { error: 'خطا در دریافت کاربران' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    // ============================================================
    // Authorization
    // ============================================================

    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 401 }
      )
    }

    // ============================================================
    // Parse JSON
    // ============================================================

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

    // ============================================================
    // Validate email
    // ============================================================

    if (!isValidEmail(data.email)) {
      return NextResponse.json(
        {
          error: 'ایمیل واردشده معتبر نیست',
        },
        { status: 400 }
      )
    }

    const email = data.email
      .trim()
      .toLowerCase()

    // ============================================================
    // Validate password
    // ============================================================

    if (!isValidPassword(data.password)) {
      return NextResponse.json(
        {
          error: `رمز عبور باید بین ${MIN_PASSWORD_LENGTH} تا ${MAX_PASSWORD_LENGTH} کاراکتر باشد`,
        },
        { status: 400 }
      )
    }

    // ============================================================
    // Validate optional name
    // ============================================================

    let name: string | null = null

    if (
      data.name !== undefined &&
      data.name !== null
    ) {
      if (!isValidName(data.name)) {
        return NextResponse.json(
          {
            error: `نام باید حداکثر ${MAX_NAME_LENGTH} کاراکتر باشد`,
          },
          { status: 400 }
        )
      }

      name = data.name.trim()
    }

    // ============================================================
    // Validate role
    //
    // Default role = USER
    // ============================================================

    let role: UserRole = 'USER'

    if (data.role !== undefined) {
        if (!isValidRole(data.role)) {
            return NextResponse.json(
            {
                error: 'نقش کاربر نامعتبر است',
            },
            { status: 400 }
            )
        }

        role = data.role
    }

    // ============================================================
    // Check duplicate email
    // ============================================================

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      })

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            'کاربری با این ایمیل قبلاً وجود دارد',
        },
        { status: 409 }
      )
    }

    // ============================================================
    // Hash password
    // ============================================================

    const hashedPassword =
      await bcrypt.hash(
        data.password,
        12
      )

    // ============================================================
    // Create user
    // ============================================================

    const user =
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      })

    // ============================================================
    // Response
    //
    // Password is intentionally excluded.
    // ============================================================

    return NextResponse.json(
      user,
      { status: 201 }
    )
  } catch (error) {

    // Prisma unique constraint
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        {
          error:
            'کاربری با این ایمیل قبلاً وجود دارد',
        },
        { status: 409 }
      )
    }

    console.error(
      'POST /api/admin/users error:',
      error
    )

    return NextResponse.json(
      {
        error: 'خطا در ایجاد کاربر',
      },
      { status: 500 }
    )
  }
}