import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// POST - добавить ответ
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { reviewId, reply } = await request.json()
    
    if (!reviewId || !reply) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 })
    }
    
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        reply,
        replyDate: new Date()
      }
    })
    
    return NextResponse.json({ review })
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
    
    const { reviewId, reply } = await request.json()
    
    if (!reviewId || !reply) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 })
    }
    
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        reply,
        replyDate: new Date()
      }
    })
    
    return NextResponse.json({ review })
  } catch (error) {
    console.error('Error editing reply:', error)
    return NextResponse.json({ error: 'Ошибка редактирования ответа' }, { status: 500 })
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
    const reviewId = parseInt(searchParams.get('reviewId')!)
    
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        reply: null,
        replyDate: null
      }
    })
    
    return NextResponse.json({ review })
  } catch (error) {
    console.error('Error deleting reply:', error)
    return NextResponse.json({ error: 'Ошибка удаления ответа' }, { status: 500 })
  }
}