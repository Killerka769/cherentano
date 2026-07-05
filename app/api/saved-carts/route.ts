import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const savedCarts = await prisma.savedCart.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' }
    })
    
    return NextResponse.json({ savedCarts })
  } catch (error) {
    console.error('Error fetching saved carts:', error)
    return NextResponse.json({ error: 'Ошибка получения сохраненных корзин' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const { name, items, total } = await request.json()
    
    if (!name || !items) {
      return NextResponse.json({ error: 'Название и состав корзины обязательны' }, { status: 400 })
    }
    
    // Проверяем, что все блюда в корзине доступны
    const dishIds = items.map((item: any) => item.id)
    const availableDishes = await prisma.dish.findMany({
      where: {
        id: { in: dishIds },
        isAvailable: true
      },
      select: { id: true }
    })
    
    const availableIds = new Set(availableDishes.map(d => d.id))
    const unavailableItems = items.filter((item: any) => !availableIds.has(item.id))
    
    if (unavailableItems.length > 0) {
      return NextResponse.json({
        error: 'Некоторые блюда временно недоступны',
        unavailableItems: unavailableItems.map((item: any) => item.name)
      }, { status: 400 })
    }
    
    const savedCart = await prisma.savedCart.create({
      data: {
        userId: user.id,
        name,
        items: JSON.stringify(items),
        total: total || 0
      }
    })
    
    return NextResponse.json({ savedCart })
  } catch (error) {
    console.error('Error saving cart:', error)
    return NextResponse.json({ error: 'Ошибка сохранения корзины' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID корзины обязателен' }, { status: 400 })
    }
    
    await prisma.savedCart.delete({
      where: { id: id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cart:', error)
    return NextResponse.json({ error: 'Ошибка удаления корзины' }, { status: 500 })
  }
}