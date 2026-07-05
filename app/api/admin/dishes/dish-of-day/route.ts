import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - получить блюда дня на сегодня
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    
    const targetDate = dateParam ? new Date(dateParam) : new Date()
    targetDate.setHours(0, 0, 0, 0)
    
    const dishesOfDay = await prisma.dishOfDay.findMany({
      where: {
        date: {
          gte: targetDate,
          lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        dish: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        dish: {
          sortOrder: 'asc'
        }
      }
    })
    
    return NextResponse.json({ dishesOfDay })
  } catch (error) {
    console.error('Error fetching dishes of day:', error)
    return NextResponse.json({ error: 'Ошибка получения блюд дня' }, { status: 500 })
  }
}

// POST - добавить блюдо дня
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { dishId, date } = await request.json()
    const targetDate = date ? new Date(date) : new Date()
    targetDate.setHours(0, 0, 0, 0)
    
    // Проверяем, не существует ли уже такая пара дата+блюдо
    const existing = await prisma.dishOfDay.findUnique({
      where: {
        date_dishId: {
          date: targetDate,
          dishId: dishId
        }
      }
    })
    
    if (existing) {
      return NextResponse.json({ 
        error: 'Это блюдо уже добавлено на эту дату' 
      }, { status: 400 })
    }
    
    const dishOfDay = await prisma.dishOfDay.create({
      data: {
        dishId,
        date: targetDate
      },
      include: {
        dish: {
          include: {
            category: true
          }
        }
      }
    })
    
    return NextResponse.json({ dishOfDay }, { status: 201 })
  } catch (error) {
    console.error('Error setting dish of day:', error)
    return NextResponse.json({ error: 'Ошибка добавления блюда дня' }, { status: 500 })
  }
}

// DELETE - удалить блюдо дня
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const dishId = searchParams.get('dishId')
    const date = searchParams.get('date')
    
    if (!dishId) {
      return NextResponse.json({ error: 'Не указан ID блюда' }, { status: 400 })
    }
    
    const targetDate = date ? new Date(date) : new Date()
    targetDate.setHours(0, 0, 0, 0)
    
    await prisma.dishOfDay.delete({
      where: {
        date_dishId: {
          date: targetDate,
          dishId: parseInt(dishId)
        }
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting dish of day:', error)
    return NextResponse.json({ error: 'Ошибка удаления блюда дня' }, { status: 500 })
  }
}