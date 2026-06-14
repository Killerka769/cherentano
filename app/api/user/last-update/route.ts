import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { updatedAt: true }
    })
    
    const lastUpdate = dbUser?.updatedAt
    let remainingDays = 0
    
    if (lastUpdate) {
      const daysSinceLastUpdate = (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceLastUpdate < 7) {
        remainingDays = Math.ceil(7 - daysSinceLastUpdate)
      }
    }
    
    return NextResponse.json({ lastUpdate, remainingDays })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}