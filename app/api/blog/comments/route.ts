import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// POST - добавить комментарий
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { postId, parentId, authorName, authorEmail, content } = await request.json()
    
    if (!postId || !content) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 })
    }
    
    const comment = await prisma.blogComment.create({
      data: {
        postId,
        parentId: parentId || null,
        userId: user?.id || null,
        authorName: authorName || user?.name || 'Гость',
        authorEmail: authorEmail || user?.email || null,
        content,
        isApproved: false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    })
    
    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json({ error: 'Ошибка добавления комментария' }, { status: 500 })
  }
}
// GET - получить комментарии к посту
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    
    if (!postId) {
      return NextResponse.json({ error: 'postId обязателен' }, { status: 400 })
    }
    
    const comments = await prisma.blogComment.findMany({
      where: { 
        postId,
        isApproved: true
      },
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
    })
    
    const rootComments = comments.filter(c => !c.parentId)
    
    return NextResponse.json({ comments: rootComments })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка получения комментариев' }, { status: 500 })
  }
}