import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - получить одобренные отзывы
export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
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
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ reviews })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка получения отзывов' }, { status: 500 })
  }
}

// POST - добавить отзыв (только авторизованные, после заказа)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Только авторизованные пользователи могут оставлять отзывы' }, { status: 401 })
    }
    
    const { text, rating } = await request.json()
    
    if (!text || !rating) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 })
    }
    
    // Проверка, есть ли у пользователя завершенные заказы
    const completedOrders = await prisma.order.count({
      where: { 
        userId: user.id,
        status: 'COMPLETED'
      }
    })
    
    if (completedOrders === 0) {
      return NextResponse.json({ error: 'Оставить отзыв можно только после получения заказа' }, { status: 400 })
    }
    
    // Проверка, оставлял ли пользователь уже отзыв
    const existingReview = await prisma.review.findFirst({
      where: { userId: user.id }
    })
    
    if (existingReview) {
      return NextResponse.json({ error: 'Вы уже оставляли отзыв' }, { status: 400 })
    }
    
    const review = await prisma.review.create({
      data: {
        userId: user.id,
        authorName: user.name || user.email?.split('@')[0] || 'Гость',
        text,
        rating,
        isApproved: false
      }
    })
    
    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Error adding review:', error)
    return NextResponse.json({ error: 'Ошибка добавления отзыва' }, { status: 500 })
  }
}

// PUT - обновить свой отзыв
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const { reviewId, text, rating } = await request.json()
    
    const review = await prisma.review.findFirst({
      where: { id: reviewId, userId: user.id }
    })
    
    if (!review) {
      return NextResponse.json({ error: 'Отзыв не найден' }, { status: 404 })
    }
    
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: { 
        text, 
        rating,
        isApproved: false
      }
    })
    
    return NextResponse.json({ review: updatedReview })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка обновления отзыва' }, { status: 500 })
  }
}

// DELETE - удалить свой отзыв
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const reviewId = parseInt(searchParams.get('id')!)
    
    const review = await prisma.review.findFirst({
      where: { id: reviewId, userId: user.id }
    })
    
    if (!review) {
      return NextResponse.json({ error: 'Отзыв не найден' }, { status: 404 })
    }
    
    await prisma.review.delete({ where: { id: reviewId } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка удаления отзыва' }, { status: 500 })
  }
}