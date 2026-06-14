import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const where: any = {}
    if (status === 'pending') where.isApproved = false
    if (status === 'approved') where.isApproved = true
    
    const comments = await prisma.blogComment.findMany({
      where,
      include: {
        post: {
          select: { id: true, title: true, slug: true }
        },
        parent: {
          select: { id: true, authorName: true, content: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ comments })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка получения комментариев' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { commentId, action } = await request.json()
    
    if (action === 'approve') {
      const comment = await prisma.blogComment.update({
        where: { id: commentId },
        data: { isApproved: true }
      })
      return NextResponse.json({ comment })
    }
    
    if (action === 'delete') {
      await prisma.blogComment.delete({ where: { id: commentId } })
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: 'Неверное действие' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

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
      }
    })
    
    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}