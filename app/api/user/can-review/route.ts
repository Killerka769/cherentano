import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ canReview: false, error: 'Не авторизован' })
    }
    
    // Проверяем, есть ли у пользователя завершенные заказы
    const completedOrders = await prisma.order.count({
      where: { 
        userId: user.id,
        status: 'COMPLETED'
      }
    })
    
    // Проверяем, оставлял ли пользователь уже отзыв
    const existingReview = await prisma.review.findFirst({
      where: { userId: user.id }
    })
    
    const canReview = completedOrders > 0 && !existingReview
    
    return NextResponse.json({ 
      canReview,
      completedOrders,
      hasReview: !!existingReview
    })
  } catch (error) {
    console.error('Error checking can review:', error)
    return NextResponse.json({ canReview: false, error: 'Ошибка проверки' })
  }
}