import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - получить все публичные посты
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '9')
    const page = parseInt(searchParams.get('page') || '1')
    
    const where: any = { isPublished: true }
    if (category && category !== 'all') {
      where.category = { slug: category }
    }
    
    const posts = await prisma.blogPost.findMany({
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
    
    const total = await prisma.blogPost.count({ where })
    
    return NextResponse.json({
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка получения постов' }, { status: 500 })
  }
}

// POST - создать пост (только админ)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { title, slug, excerpt, content, imageUrl, categoryId, author, isPublished, publishedAt } = await request.json()
    
    const post = await prisma.blogPost.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/ /g, '-'),
        excerpt,
        content,
        imageUrl,
        categoryId,
        author: author || 'Ресторан Челентано',
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null
      },
      include: { category: true }
    })
    
    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка создания поста' }, { status: 500 })
  }
}