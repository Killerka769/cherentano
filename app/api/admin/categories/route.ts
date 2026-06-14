import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// PUT - обновить категорию
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const { name, slug, sortOrder } = await request.json()
    
    const category = await prisma.category.update({
      where: { id: parseInt(id!) },
      data: { name, slug, sortOrder }
    })
    
    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Ошибка обновления категории' }, { status: 500 })
  }
}

// DELETE - удалить категорию
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    // Сначала обновляем блюда - устанавливаем categoryId = 1 (категория "Прочее" или первая существующая)
    // Получаем первую категорию как дефолтную
    const defaultCategory = await prisma.category.findFirst()
    
    if (defaultCategory) {
      await prisma.dish.updateMany({
        where: { categoryId: parseInt(id!) },
        data: { categoryId: defaultCategory.id }
      })
    }
    
    // Затем удаляем категорию
    await prisma.category.delete({ where: { id: parseInt(id!) } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Ошибка удаления категории' }, { status: 500 })
  }
}

// POST - создать категорию
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { name, slug, sortOrder } = await request.json()
    
    const category = await prisma.category.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/ /g, '-'),
        sortOrder: sortOrder || 0
      }
    })
    
    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Ошибка создания категории' }, { status: 500 })
  }
}