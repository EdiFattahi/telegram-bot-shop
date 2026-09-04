import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// ============================================================
// Constants
// ============================================================

const MAX_USER_ID_LENGTH = 100
const MAX_NAME_LENGTH = 100
const MAX_EMAIL_LENGTH = 254

const VALID_ROLES = [
  'USER',
  'ADMIN',
] as const

type UserRole = (typeof VALID_ROLES)[number]

// ============================================================
// Validation
// ============================================================

function isValidUserId(
  value: unknown
): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().length <= MAX_USER_ID_LENGTH
  )
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
  value: string
): boolean {
  if (
    value.length === 0 ||
    value.length > MAX_EMAIL_LENGTH
  ) {
    return false
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  )
}

// ============================================================
// Authorization
// ============================================================

async function requireAdmin(): Promise<boolean> {
  const user = await getCurrentUser()

  return user?.role === 'ADMIN'
}

// ============================================================
// Params
// ============================================================

async function getUserId(
  params: Promise<{ id: string }>
): Promise<string | null> {
  const { id } = await params

  if (!isValidUserId(id)) {
    return null
  }

  return id.trim()
}

// ============================================================
// User Select
// ============================================================

const userDetailsSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,

  orders: {
    orderBy: {
      createdAt: 'desc' as const,
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
    },
  },
}

// ============================================================
// GET /api/admin/users/[id]
// ============================================================

export async function GET(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  try {
    // ----------------------------------------------------------
    // Authorization
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // Validate User ID
    // ----------------------------------------------------------

    const userId = await getUserId(params)

    if (!userId) {
      return NextResponse.json(
        {
          error: 'شناسه کاربر نامعتبر است',
        },
        {
          status: 400,
        }
      )
    }

    // ----------------------------------------------------------
    // Fetch User
    // ----------------------------------------------------------

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: userDetailsSelect,
      })

    // ----------------------------------------------------------
    // Not Found
    // ----------------------------------------------------------

    if (!user) {
      return NextResponse.json(
        {
          error: 'کاربر یافت نشد',
        },
        {
          status: 404,
        }
      )
    }

    // ----------------------------------------------------------
    // Success
    // ----------------------------------------------------------

    return NextResponse.json(
      user,
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error(
      'GET /api/admin/users/[id] error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'خطا در دریافت اطلاعات کاربر',
      },
      {
        status: 500,
      }
    )
  }
}

// ============================================================
// PATCH /api/admin/users/[id]
// ============================================================

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  try {
    // ----------------------------------------------------------
    // Authorization
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // Validate User ID
    // ----------------------------------------------------------

    const userId = await getUserId(params)

    if (!userId) {
      return NextResponse.json(
        {
          error: 'شناسه کاربر نامعتبر است',
        },
        {
          status: 400,
        }
      )
    }

    // ----------------------------------------------------------
    // Parse Body
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // Validate Body Object
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // Allowed Fields
    // ----------------------------------------------------------

    const allowedFields = [
      'name',
      'email',
      'role',
    ]

    const receivedFields =
      Object.keys(data)

    const hasUnknownField =
      receivedFields.some(
        (field) =>
          !allowedFields.includes(field)
      )

    if (hasUnknownField) {
      return NextResponse.json(
        {
          error:
            'فقط نام، ایمیل و نقش قابل ویرایش هستند',
        },
        {
          status: 400,
        }
      )
    }

    if (receivedFields.length === 0) {
      return NextResponse.json(
        {
          error:
            'حداقل یک فیلد برای ویرایش ارسال کنید',
        },
        {
          status: 400,
        }
      )
    }

    // ----------------------------------------------------------
    // Check Existing User
    // ----------------------------------------------------------

    const existingUser =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      })

    if (!existingUser) {
      return NextResponse.json(
        {
          error: 'کاربر یافت نشد',
        },
        {
          status: 404,
        }
      )
    }

    // ----------------------------------------------------------
    // Build Update Data
    // ----------------------------------------------------------

    const updateData: {
      name?: string | null
      email?: string
      role?: UserRole
    } = {}

    // ==========================================================
    // Name
    // ==========================================================

    if ('name' in data) {
      if (
        data.name !== null &&
        typeof data.name !== 'string'
      ) {
        return NextResponse.json(
          {
            error: 'نام کاربر نامعتبر است',
          },
          {
            status: 400,
          }
        )
      }

      if (
        typeof data.name === 'string'
      ) {
        const name =
          data.name.trim()

        if (
          name.length > MAX_NAME_LENGTH
        ) {
          return NextResponse.json(
            {
              error:
                'نام کاربر بیش از حد طولانی است',
            },
            {
              status: 400,
            }
          )
        }

        updateData.name =
          name.length > 0
            ? name
            : null
      } else {
        updateData.name = null
      }
    }

    // ==========================================================
    // Email
    // ==========================================================

    if ('email' in data) {
      if (
        typeof data.email !== 'string'
      ) {
        return NextResponse.json(
          {
            error: 'ایمیل نامعتبر است',
          },
          {
            status: 400,
          }
        )
      }

      const email =
        data.email
          .trim()
          .toLowerCase()

      if (!isValidEmail(email)) {
        return NextResponse.json(
          {
            error:
              'فرمت ایمیل نامعتبر است',
          },
          {
            status: 400,
          }
        )
      }

      // --------------------------------------------------------
      // Email Uniqueness
      // --------------------------------------------------------

      const emailOwner =
        await prisma.user.findUnique({
          where: {
            email,
          },

          select: {
            id: true,
          },
        })

      if (
        emailOwner &&
        emailOwner.id !== userId
      ) {
        return NextResponse.json(
          {
            error:
              'این ایمیل قبلاً توسط کاربر دیگری استفاده شده است',
          },
          {
            status: 409,
          }
        )
      }

      updateData.email = email
    }

    // ==========================================================
    // Role
    // ==========================================================

    if ('role' in data) {
      if (!isValidRole(data.role)) {
        return NextResponse.json(
          {
            error:
              'نقش کاربر نامعتبر است',
          },
          {
            status: 400,
          }
        )
      }

      updateData.role = data.role
    }

    // ----------------------------------------------------------
    // Update User
    // ----------------------------------------------------------

    const updatedUser =
      await prisma.user.update({
        where: {
          id: userId,
        },

        data: updateData,

        select: userDetailsSelect,
      })

    // ----------------------------------------------------------
    // Success
    // ----------------------------------------------------------

    return NextResponse.json(
      updatedUser,
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error(
      'PATCH /api/admin/users/[id] error:',
      error
    )

    return NextResponse.json(
      {
        error: 'خطا در ویرایش کاربر',
      },
      {
        status: 500,
      }
    )
  }
}