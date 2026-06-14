import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    const dish = await prisma.dish.findUnique({
      where: { slug },
      include: {
        category: true
      }
    })
    
    // Если блюдо не найдено или НЕ доступно - возвращаем 404
    if (!dish || !dish.isAvailable) {
      return NextResponse.json(
        { error: 'Блюдо не найдено' },
        { status: 404 }
      )
    }
    
    // Получаем похожие блюда (только доступные)
    const similarDishes = await prisma.dish.findMany({
      where: {
        categoryId: dish.categoryId,
        id: { not: dish.id },
        isAvailable: true 
      },
      take: 4,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        imageUrl: true,
        weight: true
      },
      orderBy: { sortOrder: 'asc' }
    })
    
    return NextResponse.json({ dish, similarDishes })
  } catch (error) {
    console.error('Error fetching dish:', error)
    return NextResponse.json(
      { error: 'Ошибка получения блюда' },
      { status: 500 }
    )
  }
}