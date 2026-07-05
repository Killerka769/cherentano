import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// POST - деактивировать все истекшие скидки
export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const now = new Date()
    
    // Находим все активные скидки с истекшей датой окончания
    const expiredDiscounts = await prisma.discount.findMany({
      where: {
        isActive: true,
        endDate: { lt: now }
      }
    })
    
    // Деактивируем их
    const result = await prisma.discount.updateMany({
      where: {
        isActive: true,
        endDate: { lt: now }
      },
      data: {
        isActive: false
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      deactivatedCount: result.count,
      deactivatedIds: expiredDiscounts.map(d => d.id)
    })
  } catch (error) {
    console.error('Error expiring discounts:', error)
    return NextResponse.json({ error: 'Ошибка деактивации скидок' }, { status: 500 })
  }
}