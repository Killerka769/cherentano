import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { orderId, status } = await request.json()
    
    // Находим заказ
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    })
    
    if (!order) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 })
    }
    
    // Обновляем статус заказа
    await prisma.order.update({
      where: { id: orderId },
      data: { status }
    })
    
    // Если заказ благотворительный и статус COMPLETED
    if (order.isCharity && status === 'COMPLETED') {
      // Находим связанную заявку на помощь
      const helpRequest = await prisma.helpRequest.findFirst({
        where: { orderId: orderId }
      })
      
      if (helpRequest) {
        // Обновляем статус заявки
        await prisma.helpRequest.update({
          where: { id: helpRequest.id },
          data: {
            status: 'COMPLETED',
            deliveredAt: new Date()
          }
        })
        
        // Обновляем или создаём историю
        const existingHistory = await prisma.helpHistory.findFirst({
          where: { helpRequestId: helpRequest.id }
        })
        
        if (existingHistory) {
          await prisma.helpHistory.update({
            where: { id: existingHistory.id },
            data: {
              amount: order.total,
              items: order.items.map((item: any) => ({
                name: item.dishName,
                quantity: item.quantity,
                price: item.price
              }))
            }
          })
        } else {
          await prisma.helpHistory.create({
            data: {
              helpRequestId: helpRequest.id,
              beneficiaryId: helpRequest.beneficiaryId,
              userId: order.userId,
              mealTime: helpRequest.mealTime || 'LUNCH',
              amount: order.total,
              items: order.items.map((item: any) => ({
                name: item.dishName,
                quantity: item.quantity,
                price: item.price
              })),
              comment: `Заказ #${order.id}`
            }
          })
        }
        
        console.log(`✅ Charity order #${orderId} completed and history updated`)
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error syncing charity order:', error)
    return NextResponse.json({ error: 'Ошибка синхронизации' }, { status: 500 })
  }
}