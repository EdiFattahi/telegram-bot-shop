import { NextResponse } from 'next/server'
import { verifyUser, createToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'ایمیل و رمز عبور را وارد کنید' },
        { status: 400 }
      )
    }

    const user = await verifyUser(email, password)
    
    if (!user) {
      return NextResponse.json(
        { error: 'ایمیل یا رمز عبور اشتباه است' },
        { status: 401 }
      )
    }

    const token = await createToken(user)
    
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'خطا در ورود' },
      { status: 500 }
    )
  }
}