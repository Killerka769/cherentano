import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ usedIds: [] })
    }
    
    // Получаем ID скидок, которые уже использовал пользователь
    const usages = await prisma.discountUsage.findMany({
      where: {
        userId: user.id
      },
      select: {
        discountId: true
      }
    })
    
    const usedIds = usages.map(u => u.discountId)
    
    return NextResponse.json({ usedIds })
  } catch (error) {
    console.error('Error fetching used discounts:', error)
    return NextResponse.json({ usedIds: [] })
  }
}