import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// Функция-помощник: создаёт "чистую" UTC дату без влияния локальной таймзоны сервера
function parseToUTCDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
}

// 👇 ОБНОВЛЕНИЕ ДОСТУПНОСТИ БЛЮД ДЛЯ КОНКРЕТНОЙ ДАТЫ
async function updateDishAvailabilityForDate(date: Date) {
  try {
    // Получаем все блюда, добавленные в меню на эту дату
    const menuItems = await prisma.weeklyMenu.findMany({
      where: { date },
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
    
    console.log(`✅ Updated availability for ${date.toISOString().split('T')[0]}: ${availableDishIds.length} dishes available`)
    return availableDishIds
  } catch (error) {
    console.error('Error updating dish availability:', error)
    throw error
  }
}

// GET - получить меню на неделю
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    
    if (!startDate) {
      return NextResponse.json({ error: 'Параметр startDate обязателен' }, { status: 400 })
    }
    
    const normalizedDate = parseToUTCDate(startDate)
    
    const endDate = new Date(normalizedDate)
    endDate.setUTCDate(endDate.getUTCDate() + 7)
    
    const weeklyMenu = await prisma.weeklyMenu.findMany({
      where: {
        date: {
          gte: normalizedDate,
          lt: endDate
        }
      },
      include: {
        dish: {
          include: {
            category: true
          }
        }
      },
      orderBy: { date: 'asc' }
    })
    
    const groupedMenu: Record<string, any[]> = {}
    
    weeklyMenu.forEach(item => {
      const dateKey = item.date.toISOString().split('T')[0]
      if (!groupedMenu[dateKey]) {
        groupedMenu[dateKey] = []
      }
      groupedMenu[dateKey].push(item)
    })
    
    return NextResponse.json({
      menu: groupedMenu,
      startDate: startDate,
      days: Object.keys(groupedMenu)
    })
  } catch (error) {
    console.error('Error fetching weekly menu:', error)
    return NextResponse.json({ menu: {}, days: [] }, { status: 500 })
  }
}

// POST - добавить блюда в меню
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const body = await request.json()
    const { date, dishIds } = body
    
    if (!date) {
      return NextResponse.json({ error: 'Дата обязательна' }, { status: 400 })
    }
    
    if (!dishIds || !Array.isArray(dishIds) || dishIds.length === 0) {
      return NextResponse.json({ error: 'Выберите хотя бы одно блюдо' }, { status: 400 })
    }
    
    const normalizedDate = parseToUTCDate(date)
    
    const results = []
    const errors = []
    const addedIds = []
    
    const existingDishes = await prisma.dish.findMany({
      where: { id: { in: dishIds } }
    })
    
    const foreignKeys = await prisma.weeklyMenu.findMany({
      where: {
        date: normalizedDate,
        dishId: { in: dishIds }
      },
      select: { dishId: true }
    })
    const alreadyAddedIds = new Set(foreignKeys.map(k => k.dishId))
    
    for (const id of dishIds) {
      const dish = existingDishes.find(d => d.id === id)
      
      if (!dish) {
        errors.push(`Блюдо с ID ${id} не найдено`)
        continue
      }
      
      if (alreadyAddedIds.has(id)) {
        errors.push(`Блюдо "${dish.name}" уже добавлено на эту дату`)
        continue
      }
      
      try {
        const weeklyMenu = await prisma.weeklyMenu.create({
          data: {
            date: normalizedDate,
            dishId: id
          },
          include: {
            dish: {
              include: {
                category: true
              }
            }
          }
        })
        results.push(weeklyMenu)
        addedIds.push(id)
      } catch (error) {
        console.error(`Error adding dish ID ${id}:`, error)
        errors.push(`Ошибка при сохранении блюда "${dish.name}"`)
      }
    }
    
    // 👇 ОБНОВЛЯЕМ ДОСТУПНОСТЬ ДЛЯ ЭТОЙ ДАТЫ
    if (results.length > 0) {
      await updateDishAvailabilityForDate(normalizedDate)
    }
    
    return NextResponse.json({ 
      results,
      errors: errors.length > 0 ? errors : undefined,
      success: results.length > 0,
      addedCount: results.length,
      addedIds
    })
    
  } catch (error) {
    console.error('Error adding to weekly menu:', error)
    return NextResponse.json({ error: 'Ошибка добавления в меню' }, { status: 500 })
  }
}

// DELETE - удалить блюдо из меню
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 })
    }
    
    const parsedId = parseInt(id, 10)
    if (isNaN(parsedId)) {
      return NextResponse.json({ error: 'Неверный формат ID' }, { status: 400 })
    }
    
    // Получаем дату перед удалением
    const item = await prisma.weeklyMenu.findUnique({
      where: { id: parsedId },
      select: { date: true }
    })
    
    await prisma.weeklyMenu.delete({
      where: { id: parsedId }
    })
    
    // 👇 ОБНОВЛЯЕМ ДОСТУПНОСТЬ ПОСЛЕ УДАЛЕНИЯ
    if (item) {
      await updateDishAvailabilityForDate(item.date)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting from weekly menu:', error)
    return NextResponse.json({ error: 'Ошибка удаления или запись не найдена' }, { status: 500 })
  }
}