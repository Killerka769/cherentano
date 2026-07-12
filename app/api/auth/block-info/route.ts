import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ isBlocked: false }, { status: 401 })
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        isBlocked: true,
        blockedUntil: true,
        blockReason: true,
        blockedBy: true,
        blockedAt: true
      }
    })
    
    if (!dbUser) {
      return NextResponse.json({ isBlocked: false })
    }
    
    // Проверяем, истекла ли блокировка
    if (dbUser.isBlocked && dbUser.blockedUntil && new Date(dbUser.blockedUntil) < new Date()) {
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
      return NextResponse.json({ isBlocked: false })
    }
    
    return NextResponse.json({
      isBlocked: dbUser.isBlocked,
      blockedUntil: dbUser.blockedUntil,
      blockReason: dbUser.blockReason,
      blockedBy: dbUser.blockedBy,
      blockedAt: dbUser.blockedAt
    })
  } catch (error) {
    console.error('Error fetching block info:', error)
    return NextResponse.json({ isBlocked: false }, { status: 500 })
  }
}