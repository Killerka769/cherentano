import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - получить неоплаченный заказ пользователя
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const pendingOrder = await prisma.order.findFirst({
      where: {
        userId: user.id,
        paymentStatus: 'PENDING',
        status: 'NEW',
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000) // последние 30 минут
        }
      },
      include: {
        items: true
      }
    })
    
    return NextResponse.json({ order: pendingOrder })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

// POST - отметить заказ как оплаченный
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const { orderId } = await request.json()
    
    const order = await prisma.order.update({
      where: { id: orderId, userId: user.id },
      data: {
        paymentStatus: 'PAID',
        isReminded: true,
        status: 'CONFIRMED'
      }
    })
    
    return NextResponse.json({ order })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}