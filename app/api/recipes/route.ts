import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - получить опубликованные рецепты
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '9')
    const page = parseInt(searchParams.get('page') || '1')
    
    const where: any = { isPublished: true }
    
    if (category && category !== 'all') {
      where.category = { slug: category }
    }
    
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    const recipes = await prisma.recipe.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: { comments: true }
        }
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit
    })
    
    const total = await prisma.recipe.count({ where })
    
    return NextResponse.json({
      recipes,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Error fetching recipes:', error)
    return NextResponse.json({ error: 'Ошибка получения рецептов' }, { status: 500 })
  }
}

// POST - создать рецепт (только админ)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const body = await request.json()
    const { 
      title, 
      slug, 
      excerpt, 
      content, 
      imageUrl, 
      categoryId, 
      author, 
      cookingTime, 
      servings, 
      difficulty,
      isPublished 
    } = body
    
    const recipe = await prisma.recipe.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/[^а-яёa-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
        excerpt: excerpt || null,
        content,
        imageUrl: imageUrl || null,
        categoryId,
        author: author || 'Ресторан Челентано',
        cookingTime: cookingTime ? parseInt(cookingTime) : null,
        servings: servings ? parseInt(servings) : null,
        difficulty: difficulty || 'MEDIUM',
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null
      },
      include: { category: true }
    })
    
    return NextResponse.json({ recipe }, { status: 201 })
  } catch (error) {
    console.error('Error creating recipe:', error)
    return NextResponse.json({ error: 'Ошибка создания рецепта' }, { status: 500 })
  }
}

// PUT - обновить рецепт (только админ)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const body = await request.json()
    const { 
      id,
      title, 
      slug, 
      excerpt, 
      content, 
      imageUrl, 
      categoryId, 
      author, 
      cookingTime, 
      servings, 
      difficulty,
      isPublished 
    } = body
    
    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/[^а-яёa-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
        excerpt: excerpt || null,
        content,
        imageUrl: imageUrl || null,
        categoryId,
        author: author || 'Ресторан Челентано',
        cookingTime: cookingTime ? parseInt(cookingTime) : null,
        servings: servings ? parseInt(servings) : null,
        difficulty: difficulty || 'MEDIUM',
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null,
        updatedAt: new Date()
      },
      include: { category: true }
    })
    
    return NextResponse.json({ recipe })
  } catch (error) {
    console.error('Error updating recipe:', error)
    return NextResponse.json({ error: 'Ошибка обновления рецепта' }, { status: 500 })
  }
}

// DELETE - удалить рецепт (только админ)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID рецепта обязателен' }, { status: 400 })
    }
    
    await prisma.recipe.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting recipe:', error)
    return NextResponse.json({ error: 'Ошибка удаления рецепта' }, { status: 500 })
  }
}