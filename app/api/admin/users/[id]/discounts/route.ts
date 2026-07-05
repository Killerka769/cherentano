import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - получить все скидки пользователя
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { id: userId } = await params
    
    const userDiscounts = await prisma.userDiscount.findMany({
      where: { userId },
      include: {
        discount: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ discounts: userDiscounts })
  } catch (error) {
    console.error('Error fetching user discounts:', error)
    return NextResponse.json({ error: 'Ошибка получения скидок' }, { status: 500 })
  }
}

// DELETE - удалить скидку у пользователя
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const body = await request.json()
    const { userDiscountId } = body
    
    await prisma.userDiscount.delete({
      where: { id: userDiscountId }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user discount:', error)
    return NextResponse.json({ error: 'Ошибка удаления скидки' }, { status: 500 })
  }
}

// PUT - продлить скидку
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const body = await request.json()
    const { userDiscountId, days } = body
    
    const userDiscount = await prisma.userDiscount.findUnique({
      where: { id: userDiscountId },
      include: { discount: true }
    })
    
    if (!userDiscount) {
      return NextResponse.json({ error: 'Скидка не найдена' }, { status: 404 })
    }
    
    const newExpiresAt = new Date()
    newExpiresAt.setDate(newExpiresAt.getDate() + days)
    
    const updated = await prisma.userDiscount.update({
      where: { id: userDiscountId },
      data: { expiresAt: newExpiresAt }
    })
    
    return NextResponse.json({ userDiscount: updated })
  } catch (error) {
    console.error('Error extending discount:', error)
    return NextResponse.json({ error: 'Ошибка продления скидки' }, { status: 500 })
  }
}