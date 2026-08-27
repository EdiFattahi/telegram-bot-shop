import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secretKey = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'your-super-secret-key-change-this'
)

export async function proxy(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  
  if (!isAdminRoute) {
    return NextResponse.next()
  }

  const token = request.cookies.get('auth-token')?.value
  
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const { payload } = await jwtVerify(token, secretKey)
    
    if (payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    return NextResponse.next()
  } catch {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: ['/admin/:path*']
}