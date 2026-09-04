import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { cookies } from 'next/headers'

const JWT_ISSUER = 'ai-services'
const JWT_AUDIENCE = 'ai-services-web'
const JWT_ALGORITHM = 'HS256'
const AUTH_COOKIE_NAME = 'auth-token'
const JWT_EXPIRES_IN = '24h'

function getSecretKey(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET

  if (!secret || secret.length < 32) {
    throw new Error(
      'NEXTAUTH_SECRET must be configured and contain at least 32 characters.'
    )
  }

  return new TextEncoder().encode(secret)
}

export interface UserPayload {
  id: string
  email: string
  name: string | null
  role: string
}

function isValidUserPayload(
  payload: JWTPayload
): payload is JWTPayload & UserPayload {
  return (
    typeof payload.id === 'string' &&
    typeof payload.email === 'string' &&
    (typeof payload.name === 'string' ||
      payload.name === null ||
      payload.name === undefined) &&
    typeof payload.role === 'string'
  )
}

export async function verifyUser(
  email: string,
  password: string
): Promise<UserPayload | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return null
    }

    const isValid = await bcrypt.compare(
      password,
      user.password
    )

    if (!isValid) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }
  } catch (error) {
    console.error('Verify user error:', error)
    return null
  }
}

export async function createToken(
  user: UserPayload
): Promise<string> {
  const secretKey = getSecretKey()

  return await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({
      alg: JWT_ALGORITHM,
      typ: 'JWT',
    })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secretKey)
}

export async function verifyToken(
  token: string
): Promise<UserPayload | null> {
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

    if (!isValidUserPayload(payload)) {
      return null
    }

    return {
      id: payload.id,
      email: payload.email,
      name:
        typeof payload.name === 'string'
          ? payload.name
          : null,
      role: payload.role,
    }
  } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith(
          'NEXTAUTH_SECRET must be configured'
        )
      ) {
        console.error(error.message)
      }

      return null
    }
}

export async function getCurrentUser(): Promise<UserPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(
    AUTH_COOKIE_NAME
  )?.value

  if (!token) {
    return null
  }

  return await verifyToken(token)
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()

  return user?.role === 'ADMIN'
}

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24,
}