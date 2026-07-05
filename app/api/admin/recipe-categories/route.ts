import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - получить все категории рецептов
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const categories = await prisma.recipeCategory.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ categories })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка получения категорий' }, { status: 500 })
  }
}

// POST - создать категорию
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { name, slug, description } = await request.json()
    
    const category = await prisma.recipeCategory.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/ /g, '-'),
        description: description || null
      }
    })
    
    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка создания категории' }, { status: 500 })
  }
}

// PUT - обновить категорию
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { id, name, slug, description } = await request.json()
    
    const category = await prisma.recipeCategory.update({
      where: { id },
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/ /g, '-'),
        description: description || null
      }
    })
    
    return NextResponse.json({ category })
  } catch (error) {
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
    
    await prisma.recipeCategory.delete({ where: { id: id! } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка удаления категории' }, { status: 500 })
  }
}