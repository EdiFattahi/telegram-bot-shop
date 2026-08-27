import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secretKey = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'your-super-secret-key-change-this'
)

export interface UserPayload {
  id: string
  email: string
  name: string | null
  role: string
}

export async function verifyUser(email: string, password: string): Promise<UserPayload | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) return null

    const isValid = await bcrypt.compare(password, user.password)
    
    if (!isValid) return null

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  } catch (error) {
    console.error('Verify user error:', error)
    return null
  }
}

export async function createToken(user: UserPayload): Promise<string> {
  return await new SignJWT({ 
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secretKey)
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey)
    return payload as unknown as UserPayload
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<UserPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  
  if (!token) return null
  
  return await verifyToken(token)
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'ADMIN'
}