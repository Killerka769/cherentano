import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ isBlocked: false })
    }
    
    if (!user.isBlocked) {
      return NextResponse.json({ isBlocked: false })
    }
    
    // Проверяем, истекла ли временная блокировка
    if (user.blockedUntil && new Date(user.blockedUntil) < new Date()) {
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
    
    let blockedByUser = null
    if (user.blockedBy) {
      blockedByUser = await prisma.user.findUnique({
        where: { id: user.blockedBy },
        select: { name: true, email: true }
      })
    }
    
    return NextResponse.json({
      isBlocked: true,
      blockedUntil: user.blockedUntil,
      blockReason: user.blockReason,
      blockedAt: user.blockedAt,
      blockedBy: blockedByUser?.name || user.blockedBy
    })
  } catch (error) {
    console.error('Error fetching block info:', error)
    return NextResponse.json({ isBlocked: false }, { status: 500 })
  }
}