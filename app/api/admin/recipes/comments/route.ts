import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const recipeId = searchParams.get('recipeId')
    
    const where: any = {}
    
    if (status === 'pending') {
      where.isApproved = false
    } else if (status === 'approved') {
      where.isApproved = true
    }
    // если status === 'all' или не указан, не добавляем фильтр
    
    if (recipeId) {
      where.recipeId = recipeId
    }
    
    const comments = await prisma.recipeComment.findMany({
      where,
      include: {
        recipe: {
          select: { id: true, title: true, slug: true }
        },
        user: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Ошибка получения комментариев' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { commentId, action } = await request.json()
    
    if (action === 'approve') {
      const comment = await prisma.recipeComment.update({
        where: { id: commentId },
        data: { isApproved: true }
      })
      return NextResponse.json({ comment })
    }
    
    if (action === 'delete') {
      await prisma.recipeComment.delete({ where: { id: commentId } })
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: 'Неверное действие' }, { status: 400 })
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json({ error: 'Ошибка обновления' }, { status: 500 })
  }
}