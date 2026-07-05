import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcrypt'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
const SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createToken(userId: string, role: string): Promise<string> {
  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}

export async function getSession(): Promise<any> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null
  
  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      role: true,
      phoneVerified: true,
      phoneVerifiedAt: true,
      isBlocked: true,
      blockedUntil: true,
      blockReason: true,
      blockedAt: true,
      blockedBy: true,
      birthDate: true,
      createdAt: true,
      updatedAt: true
    }
  })
  
  if (!user) return null
  
  // Проверяем, истекла ли временная блокировка
  if (user.isBlocked && user.blockedUntil && new Date(user.blockedUntil) < new Date()) {
    // Автоматически разблокируем
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isBlocked: false,
        blockedUntil: null,
        blockReason: null,
        blockedAt: null,
        blockedBy: null
      }
    })
    return { ...user, isBlocked: false, blockedUntil: null, blockReason: null }
  }
  
  return user
}