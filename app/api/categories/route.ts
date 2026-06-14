import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - получить все категории
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' }
    })
    return NextResponse.json({ categories })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка получения категорий' }, { status: 500 })
  }
}

// POST - создать категорию (только админ)
export async function POST(request: NextRequest) {
  try {
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
    return NextResponse.json({ error: 'Ошибка создания категории' }, { status: 500 })
  }
}