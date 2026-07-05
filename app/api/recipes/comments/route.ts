import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - получить комментарии к рецепту (только корневые)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recipeId = searchParams.get('recipeId')
    
    if (!recipeId) {
      return NextResponse.json({ error: 'recipeId обязателен' }, { status: 400 })
    }
    
    const comments = await prisma.recipeComment.findMany({
      where: {
        recipeId,
        isApproved: true,
        parentId: null // только корневые комментарии
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
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Ошибка получения комментариев' }, { status: 500 })
  }
}

// POST - добавить комментарий (или ответ)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()
    const { recipeId, parentId, authorName, authorEmail, content } = body
    
    console.log('📝 Creating comment:', { recipeId, parentId, content, user: user?.id })
    
    if (!recipeId || !content) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 })
    }
    
    // Проверяем существование рецепта
    const recipeExists = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true }
    })
    
    if (!recipeExists) {
      console.log('❌ Recipe not found:', recipeId)
      return NextResponse.json({ error: 'Рецепт не найден' }, { status: 404 })
    }
    
    // Если есть parentId, проверяем существование родительского комментария
    if (parentId) {
      const parent = await prisma.recipeComment.findUnique({
        where: { id: parentId }
      })
      if (!parent) {
        return NextResponse.json({ error: 'Родительский комментарий не найден' }, { status: 404 })
      }
    }
    
    const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER'
    
    const comment = await prisma.recipeComment.create({
      data: {
        recipeId,
        parentId: parentId || null,
        userId: user?.id || null,
        authorName: authorName || user?.name || 'Гость',
        authorEmail: authorEmail || user?.email || null,
        content,
        isApproved: isAdminOrManager ? true : false
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
    
    console.log('✅ Comment created:', comment.id, 'Approved:', comment.isApproved)
    
    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json({ error: 'Ошибка добавления комментария' }, { status: 500 })
  }
}

// PUT - обновить комментарий
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { commentId, content } = await request.json()
    
    if (!commentId || !content) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 })
    }
    
    const comment = await prisma.recipeComment.findUnique({
      where: { id: commentId },
      include: { user: true }
    })
    
    if (!comment) {
      return NextResponse.json({ error: 'Комментарий не найден' }, { status: 404 })
    }
    
    const isAuthor = user?.id === comment.userId
    const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER'
    
    if (!isAuthor && !isAdminOrManager) {
      return NextResponse.json({ error: 'Нет прав для редактирования' }, { status: 403 })
    }
    
    const updatedComment = await prisma.recipeComment.update({
      where: { id: commentId },
      data: {
        content,
        isApproved: isAdminOrManager ? true : false // Админы/менеджеры после редактирования не требуют модерации
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
    
    return NextResponse.json({ comment: updatedComment })
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json({ error: 'Ошибка обновления комментария' }, { status: 500 })
  }
}

// DELETE - удалить комментарий (и все его ответы каскадно)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('id')
    
    if (!commentId) {
      return NextResponse.json({ error: 'ID комментария обязателен' }, { status: 400 })
    }
    
    const comment = await prisma.recipeComment.findUnique({
      where: { id: commentId },
      include: { user: true }
    })
    
    if (!comment) {
      return NextResponse.json({ error: 'Комментарий не найден' }, { status: 404 })
    }
    
    const isAuthor = user?.id === comment.userId
    const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER'
    
    if (!isAuthor && !isAdminOrManager) {
      return NextResponse.json({ error: 'Нет прав для удаления' }, { status: 403 })
    }
    
    // Удаляем комментарий (все дочерние удалятся благодаря onDelete: Cascade)
    await prisma.recipeComment.delete({
      where: { id: commentId }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ error: 'Ошибка удаления комментария' }, { status: 500 })
  }
}