import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        {
          user: null,
        },
        {
          status: 401,
        }
      )
    }

    return NextResponse.json(
      {
        user,
      },
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error(
      'GET /api/auth/me error:',
      error instanceof Error
        ? error.message
        : error
    )

    return NextResponse.json(
      {
        user: null,
        error: 'خطا در بررسی وضعیت ورود',
      },
      {
        status: 500,
      }
    )
  }
}