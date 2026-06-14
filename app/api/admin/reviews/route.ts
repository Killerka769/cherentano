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
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ reviews })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка получения отзывов' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { reviewId } = await request.json()
    
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { isApproved: true }
    })
    
    return NextResponse.json({ review })
  } catch (error) {
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