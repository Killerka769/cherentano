import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        category: true,
        comments: {
          where: { isApproved: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true
              }
            },
            replies: {
              where: { isApproved: true },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    role: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })
    
    if (!post || !post.isPublished) {
      return NextResponse.json({ error: 'Пост не найден' }, { status: 404 })
    }
    
    // Увеличиваем счетчик просмотров
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { views: { increment: 1 } }
    })
    
    return NextResponse.json({ post })
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json({ error: 'Ошибка получения поста' }, { status: 500 })
  }
}