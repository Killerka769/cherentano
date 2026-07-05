import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - получить избранное
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: {
        dish: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            imageUrl: true,
            weight: true,
            description: true,
            isAvailable: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ favorites })
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json({ error: 'Ошибка получения избранного' }, { status: 500 })
  }
}

// POST - добавить в избранное
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const { dishId } = await request.json()
    
    // Проверяем, существует ли блюдо и доступно ли оно
    const dish = await prisma.dish.findUnique({
      where: { id: dishId },
      select: { isAvailable: true }
    })
    
    if (!dish) {
      return NextResponse.json({ error: 'Блюдо не найдено' }, { status: 404 })
    }
    
    if (!dish.isAvailable) {
      return NextResponse.json({ error: 'Блюдо временно недоступно' }, { status: 400 })
    }
    
    const favorite = await prisma.favorite.create({
      data: {
        userId: user.id,
        dishId
      },
      include: {
        dish: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            imageUrl: true,
            isAvailable: true
          }
        }
      }
    })
    
    return NextResponse.json({ favorite })
  } catch (error) {
    console.error('Error adding favorite:', error)
    return NextResponse.json({ error: 'Ошибка добавления в избранное' }, { status: 500 })
  }
}

// DELETE - удалить из избранного
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const dishId = searchParams.get('dishId')
    
    if (!dishId) {
      return NextResponse.json({ error: 'Не указан ID блюда' }, { status: 400 })
    }
    
    await prisma.favorite.delete({
      where: {
        userId_dishId: {
          userId: user.id,
          dishId: parseInt(dishId)
        }
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing favorite:', error)
    return NextResponse.json({ error: 'Ошибка удаления из избранного' }, { status: 500 })
  }
}