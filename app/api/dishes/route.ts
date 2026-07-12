import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const menuType = searchParams.get('menuType') || 'pickup'
    const limit = parseInt(searchParams.get('limit') || '9')
    const page = parseInt(searchParams.get('page') || '1')
    
    const where: any = {
      isAvailable: true
    }
    
    // Фильтр по типу меню
    if (menuType && menuType !== 'all') {
      where.OR = [
        { menuType: menuType === 'delivery' ? 'DELIVERY' : 'PICKUP' },
        { menuType: 'BOTH' }
      ]
    }
    
    if (category && category !== 'all') {
      where.category = { slug: category }
    }
    
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    const dishes = await prisma.dish.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      take: limit,
      skip: (page - 1) * limit,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        imageUrl: true,
        weight: true,
        isAvailable: true,
        menuType: true,
        sortOrder: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })
    
    const total = await prisma.dish.count({ where })
    
    return NextResponse.json({
      dishes,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Error fetching dishes:', error)
    return NextResponse.json({ error: 'Ошибка получения блюд' }, { status: 500 })
  }
}