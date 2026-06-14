import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - все посты (включая черновики) для админа
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const where: any = {}
    if (status === 'published') where.isPublished = true
    if (status === 'draft') where.isPublished = false
    
    const posts = await prisma.blogPost.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: { comments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ posts })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка получения постов' }, { status: 500 })
  }
}

// POST - создать пост
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { title, slug, excerpt, content, imageUrl, categoryId, author, isPublished } = await request.json()
    
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
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Ошибка создания поста' }, { status: 500 })
  }
}

// PUT - обновить пост
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { id, title, slug, excerpt, content, imageUrl, categoryId, author, isPublished } = await request.json()
    
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt,
        content,
        imageUrl,
        categoryId,
        author,
        isPublished,
        publishedAt: isPublished ? new Date() : null,
        updatedAt: new Date()
      },
      include: { category: true }
    })
    
    return NextResponse.json({ post })
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json({ error: 'Ошибка обновления поста' }, { status: 500 })
  }
}

// DELETE - удалить пост
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    await prisma.blogPost.delete({ where: { id: id! } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка удаления поста' }, { status: 500 })
  }
}