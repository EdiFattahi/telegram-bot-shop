import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import {
  verifyUser,
  createToken,
  AUTH_COOKIE_OPTIONS,
} from '@/lib/auth'

function isValidEmail(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }

  const email = value.trim()

  if (email.length === 0 || email.length > 254) {
    return false
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidPassword(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 256
  )
}

export async function POST(req: Request) {
  try {
    // ============================================================
    // Parse Request Body
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

    // ============================================================
    // Validate Request Body
    // ============================================================

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

    const data = body as Record<string, unknown>

    const email =
      typeof data.email === 'string'
        ? data.email.trim().toLowerCase()
        : ''

    const password = data.password

    // ============================================================
    // Validate Credentials
    // ============================================================

    if (!email || !password) {
      return NextResponse.json(
        {
          error: 'ایمیل و رمز عبور را وارد کنید',
        },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          error: 'فرمت ایمیل نامعتبر است',
        },
        { status: 400 }
      )
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        {
          error: 'رمز عبور نامعتبر است',
        },
        { status: 400 }
      )
    }

    // ============================================================
    // Verify User
    // ============================================================

    const user = await verifyUser(
      email,
      password
    )

    if (!user) {
      return NextResponse.json(
        {
          error: 'ایمیل یا رمز عبور اشتباه است',
        },
        { status: 401 }
      )
    }

    // ============================================================
    // Create Authentication Token
    // ============================================================

    const token = await createToken(user)

    // ============================================================
    // Set Authentication Cookie
    // ============================================================

    const cookieStore = await cookies()

    cookieStore.set(
      'auth-token',
      token,
      AUTH_COOKIE_OPTIONS
    )

    // ============================================================
    // Return Safe User Data
    // ============================================================

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error(
      'Login error:',
      error instanceof Error
        ? error.message
        : error
    )

    return NextResponse.json(
      {
        error: 'خطا در ورود',
      },
      { status: 500 }
    )
  }
}