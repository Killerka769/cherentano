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
          take: 5,
          include: {
            user: {
              select: { id: true, name: true, role: true }
            }
          }
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
    
    const { orderId, status, comment, reason } = await request.json()
    
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        user: true,
        items: true
      }
    })
    
    if (!existingOrder) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 })
    }
    
    // Для отмены или отклонения требуется причина
    if ((status === 'CANCELLED' || status === 'REJECTED') && !comment && !reason) {
      return NextResponse.json({ error: 'Укажите причину отмены' }, { status: 400 })
    }
    
    const finalComment = comment || reason || null
    
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
    
    // Логируем изменение статуса с комментарием
    await prisma.orderStatusLog.create({
      data: {
        orderId,
        status,
        changedBy: user.id,
        comment: finalComment
      }
    })
    
    // Автоматическая верификация телефона при выполнении заказа
    if (status === 'COMPLETED' && existingOrder.userId) {
      await prisma.user.update({
        where: { id: existingOrder.userId },
        data: {
          phoneVerified: true,
          phoneVerifiedAt: new Date()
        }
      })
    }
    
    // 👇 СИНХРОНИЗАЦИЯ С БЛАГОТВОРИТЕЛЬНОСТЬЮ
    if (status === 'COMPLETED' && existingOrder.isCharity) {
      try {
        const helpRequest = await prisma.helpRequest.findFirst({
          where: { orderId: orderId }
        })
        
        if (helpRequest) {
          await prisma.helpRequest.update({
            where: { id: helpRequest.id },
            data: {
              status: 'COMPLETED',
              deliveredAt: new Date()
            }
          })
          
          const existingHistory = await prisma.helpHistory.findFirst({
            where: { helpRequestId: helpRequest.id }
          })
          
          if (!existingHistory) {
            await prisma.helpHistory.create({
              data: {
                helpRequestId: helpRequest.id,
                beneficiaryId: helpRequest.beneficiaryId,
                userId: existingOrder.userId,
                mealTime: helpRequest.mealTime || 'LUNCH',
                amount: existingOrder.total,
                items: existingOrder.items.map((item: any) => ({
                  name: item.dishName,
                  quantity: item.quantity,
                  price: item.price
                })),
                comment: `Заказ #${orderId}`
              }
            })
          }
        }
      } catch (error) {
        console.error('Error syncing charity on order complete:', error)
      }
    }
    
    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Ошибка при обновлении заказа' }, { status: 500 })
  }
}