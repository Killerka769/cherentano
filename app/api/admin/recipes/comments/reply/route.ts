import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// POST - ответить на комментарий
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { commentId, content } = await request.json()
    
    if (!commentId || !content) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 })
    }
    
    // Получаем родительский комментарий
    const parentComment = await prisma.recipeComment.findUnique({
      where: { id: commentId },
      include: { recipe: true }
    })
    
    if (!parentComment) {
      return NextResponse.json({ error: 'Комментарий не найден' }, { status: 404 })
    }
    
    // Создаем ответ (админ/менеджер проходит модерацию автоматически)
    const reply = await prisma.recipeComment.create({
      data: {
        recipeId: parentComment.recipeId,
        parentId: commentId,
        userId: user.id,
        authorName: user.name || 'Администратор',
        authorEmail: user.email || null,
        content,
        isApproved: true // админы/менеджеры проходят сразу
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
    
    return NextResponse.json({ reply }, { status: 201 })
  } catch (error) {
    console.error('Error adding reply:', error)
    return NextResponse.json({ error: 'Ошибка добавления ответа' }, { status: 500 })
  }
}

// PUT - редактировать ответ
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { commentId, content } = await request.json()
    
    if (!commentId || !content) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 })
    }
    
    const comment = await prisma.recipeComment.findUnique({
      where: { id: commentId }
    })
    
    if (!comment) {
      return NextResponse.json({ error: 'Комментарий не найден' }, { status: 404 })
    }
    
    const updatedComment = await prisma.recipeComment.update({
      where: { id: commentId },
      data: { content }
    })
    
    return NextResponse.json({ comment: updatedComment })
  } catch (error) {
    console.error('Error updating reply:', error)
    return NextResponse.json({ error: 'Ошибка обновления ответа' }, { status: 500 })
  }
}

// DELETE - удалить ответ
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('id')
    
    if (!commentId) {
      return NextResponse.json({ error: 'ID комментария обязателен' }, { status: 400 })
    }
    
    await prisma.recipeComment.delete({
      where: { id: commentId }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting reply:', error)
    return NextResponse.json({ error: 'Ошибка удаления ответа' }, { status: 500 })
  }
}