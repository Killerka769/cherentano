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
    
    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ reviews })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка получения отзывов' }, { status: 500 })
  }
}

// Только PATCH часть, остальное без изменений

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getCurrentUser()
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { reviewId } = await request.json()
    
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { user: true }
    })
    
    if (!review) {
      return NextResponse.json({ error: 'Отзыв не найден' }, { status: 404 })
    }
    
    // Одобряем отзыв
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: { isApproved: true }
    })
    
    // ============ ВЫДАЁМ СКИДКУ ЗА ОТЗЫВ ============
    if (review.userId && review.user) {
      // Проверяем, есть ли уже скидка за отзыв у пользователя
      const existing = await prisma.userDiscount.findFirst({
        where: {
          userId: review.userId,
          discount: {
            code: {
              startsWith: 'REVIEW10_'
            }
          }
        },
        include: { discount: true }
      })
      
      // Если скидки нет - создаём
      if (!existing) {
        const individualDiscount = await prisma.discount.create({
          data: {
            code: `REVIEW10_${review.userId.slice(0, 8)}`,
            name: '10% за отзыв',
            description: 'Скидка 10% за оставленный отзыв',
            type: 'PERCENT',
            value: 10,
            isActive: true,
            isIndividual: true,
            usageLimit: 1,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        })
        
        await prisma.userDiscount.create({
          data: {
            userId: review.userId,
            discountId: individualDiscount.id,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            used: false
          }
        })
      }
    }
    
    return NextResponse.json({ review: updatedReview })
  } catch (error) {
    console.error('Error approving review:', error)
    return NextResponse.json({ error: 'Ошибка одобрения отзыва' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { reviewId } = await request.json()
    
    await prisma.review.delete({ where: { id: reviewId } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка удаления отзыва' }, { status: 500 })
  }
}