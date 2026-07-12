import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

function parseToUTCDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { date } = await request.json()
    
    if (!date) {
      return NextResponse.json({ error: 'Дата обязательна' }, { status: 400 })
    }
    
    const normalizedDate = parseToUTCDate(date)
    
    // Получаем все блюда, добавленные в меню на эту дату
    const menuItems = await prisma.weeklyMenu.findMany({
      where: { date: normalizedDate },
      select: { dishId: true }
    })
    
    const availableDishIds = menuItems.map(item => item.dishId)
    
    // Сначала делаем все блюда недоступными
    await prisma.dish.updateMany({
      where: {},
      data: { isAvailable: false }
    })
    
    // Затем делаем доступными только те, что в меню
    if (availableDishIds.length > 0) {
      await prisma.dish.updateMany({
        where: {
          id: { in: availableDishIds }
        },
        data: { isAvailable: true }
      })
    }
    
    return NextResponse.json({
      success: true,
      date: date,
      availableCount: availableDishIds.length
    })
  } catch (error) {
    console.error('Error syncing availability:', error)
    return NextResponse.json({ error: 'Ошибка синхронизации' }, { status: 500 })
  }
}