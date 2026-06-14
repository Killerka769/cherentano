import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - список блюд
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    
    const where: any = {}
    if (categoryId) where.categoryId = parseInt(categoryId)
    
    const dishes = await prisma.dish.findMany({
      where,
      include: { category: true },
      orderBy: { sortOrder: 'asc' }
    })
    
    return NextResponse.json({ dishes })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка получения блюд' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const body = await request.json()
    const { name, description, price, categoryId, imageUrl, weight, isAvailable } = body
    
    const slug = name.toLowerCase().replace(/[^а-яёa-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    
    const dish = await prisma.dish.create({
      data: {
        name,
        slug,
        description: description || null,
        price: parseFloat(price),
        categoryId: parseInt(categoryId),
        imageUrl: imageUrl || null,
        weight: weight ? parseInt(weight) : null,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        sortOrder: 0
      },
      include: { category: true }
    })
    
    return NextResponse.json({ dish }, { status: 201 })
  } catch (error) {
    console.error('Error creating dish:', error)
    return NextResponse.json({ error: 'Ошибка создания блюда' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const body = await request.json()
    const { id, name, description, price, categoryId, imageUrl, weight, isAvailable } = body
    
    const slug = name.toLowerCase().replace(/[^а-яёa-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    
    const dish = await prisma.dish.update({
      where: { id: parseInt(id) },
      data: {
        name,
        slug,
        description: description || null,
        price: parseFloat(price),
        categoryId: parseInt(categoryId),
        imageUrl: imageUrl || null,
        weight: weight ? parseInt(weight) : null,
        isAvailable: isAvailable !== undefined ? isAvailable : true
      },
      include: { category: true }
    })
    
    return NextResponse.json({ dish })
  } catch (error) {
    console.error('Error updating dish:', error)
    return NextResponse.json({ error: 'Ошибка обновления блюда' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    await prisma.dish.delete({ where: { id: parseInt(id!) } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка удаления блюда' }, { status: 500 })
  }
}