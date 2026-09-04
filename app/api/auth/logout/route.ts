import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()

    cookieStore.delete('auth-token')

    return NextResponse.json(
      {
        success: true,
      },
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error(
      'POST /api/auth/logout error:',
      error instanceof Error
        ? error.message
        : error
    )

    return NextResponse.json(
      {
        error: 'خطا در خروج از حساب',
      },
      {
        status: 500,
      }
    )
  }
}