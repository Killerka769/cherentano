import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const categories = await prisma.recipeCategory.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ categories })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка получения категорий' }, { status: 500 })
  }
}

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