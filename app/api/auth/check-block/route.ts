import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ isBlocked: false })
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        isBlocked: true, 
        blockedUntil: true 
      }
    })
    
    if (!user) {
      return NextResponse.json({ isBlocked: false })
    }
    
    // Проверяем, истекла ли блокировка
    if (user.isBlocked && user.blockedUntil && new Date(user.blockedUntil) < new Date()) {
      await prisma.user.update({
        where: { id: userId },
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
    
    return NextResponse.json({ isBlocked: user.isBlocked })
  } catch (error) {
    console.error('Error checking block:', error)
    return NextResponse.json({ isBlocked: false }, { status: 500 })
  }
}