import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_ISSUER = 'ai-services'
const JWT_AUDIENCE = 'ai-services-web'
const JWT_ALGORITHM = 'HS256'
const AUTH_COOKIE_NAME = 'auth-token'

function getSecretKey(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET

  if (!secret || secret.length < 32) {
    throw new Error(
      'NEXTAUTH_SECRET must be configured and contain at least 32 characters.'
    )
  }

  return new TextEncoder().encode(secret)
}

export async function proxy(request: NextRequest) {
  const isAdminRoute =
    request.nextUrl.pathname.startsWith('/admin')

  if (!isAdminRoute) {
    return NextResponse.next()
  }

  const token =
    request.cookies.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    const loginUrl = new URL('/login', request.url)

    loginUrl.searchParams.set(
      'callbackUrl',
      request.nextUrl.pathname
    )

    return NextResponse.redirect(loginUrl)
  }

  try {
    const secretKey = getSecretKey()

    const { payload } = await jwtVerify(
      token,
      secretKey,
      {
        algorithms: [JWT_ALGORITHM],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      }
    )

    if (payload.role !== 'ADMIN') {
      return NextResponse.redirect(
        new URL('/', request.url)
      )
    }

    return NextResponse.next()
  } catch {
    const loginUrl = new URL('/login', request.url)

    loginUrl.searchParams.set(
      'callbackUrl',
      request.nextUrl.pathname
    )

    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}