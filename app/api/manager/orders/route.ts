import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }
    
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        items: true,
        statusLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        assignedManager: {
          select: { id: true, name: true, email: true }
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            phoneVerified: true
          }
        }
      }
    })
    
    const stats = await prisma.order.groupBy({
      by: ['status'],
      _count: true
    })
    
    return NextResponse.json({ orders, stats })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Ошибка при получении заказов' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { orderId, status, comment } = await request.json()
    
    // Получаем заказ с пользователем
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    })
    
    if (!existingOrder) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 })
    }
    
    // Обновляем статус заказа
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        updatedAt: new Date(),
        ...(status === 'CONFIRMED' && { assignedTo: user.id })
      },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            phoneVerified: true
          }
        }
      }
    })
    
    // Логируем изменение статуса
    await prisma.orderStatusLog.create({
      data: {
        orderId,
        status,
        changedBy: user.id,
        comment
      }
    })
    
    // АВТОМАТИЧЕСКАЯ ВЕРИФИКАЦИЯ ТЕЛЕФОНА
    // Если заказ переведен в статус COMPLETED и у пользователя не подтвержден телефон
    if (status === 'COMPLETED' && existingOrder.userId && existingOrder.user) {
      const userToVerify = await prisma.user.findUnique({
        where: { id: existingOrder.userId },
        select: { phoneVerified: true, phone: true, id: true }
      })
      
      if (userToVerify && !userToVerify.phoneVerified) {
        await prisma.user.update({
          where: { id: existingOrder.userId },
          data: {
            phoneVerified: true,
            phoneVerifiedAt: new Date()
          }
        })
        
        console.log(`✅ Телефон ${userToVerify.phone} автоматически подтвержден после выполнения заказа #${orderId}`)
      }
    }
    
    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Ошибка при обновлении заказа' }, { status: 500 })
  }
}