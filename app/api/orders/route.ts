import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }
    
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true
      }
    })
    
    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении заказов' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      customerName, 
      customerPhone, 
      orderType, 
      deliveryAddress, 
      comment, 
      items, 
      total, 
      paymentMethod,
      needBooking,
      bookingGuests,
      bookingTime,
      bookingDate
    } = body
    
    const user = await getCurrentUser()
    
    // Валидация
    if (!customerName || !customerPhone || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Заполните все обязательные поля' },
        { status: 400 }
      )
    }
    
    // Преобразуем orderType в правильный enum
    const normalizedOrderType = orderType === 'pickup' ? 'PICKUP' : 'DELIVERY'
    const normalizedPaymentMethod = paymentMethod === 'cash' ? 'CASH' : 'CARD'
    
    // Создаем заказ
    const order = await prisma.order.create({
      data: {
        userId: user?.id || null,
        customerName,
        customerPhone,
        orderType: normalizedOrderType,
        deliveryAddress: normalizedOrderType === 'DELIVERY' ? deliveryAddress : null,
        comment: comment || '',
        total,
        paymentMethod: normalizedPaymentMethod,
        status: 'NEW',
        items: {
          create: items.map((item: any) => ({
            dishId: item.id,
            dishName: item.name,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        items: true,
        user: true
      }
    })
    
    // Логируем создание заказа
    await prisma.orderStatusLog.create({
      data: {
        orderId: order.id,
        status: 'NEW',
        comment: 'Заказ создан'
      }
    })
    
    let bookingCreated = false
    let bookingId = null
    
    // Создаем бронирование столика если нужно
    if (needBooking && normalizedOrderType === 'PICKUP' && bookingDate) {
      const bookingDateTime = new Date(bookingDate)
      
      // Проверяем, что дата не в прошлом
      if (bookingDateTime < new Date()) {
        // Не возвращаем ошибку, просто не создаем бронь
        console.log('Booking date is in the past, skipping')
      } else {
        // Находим свободный столик
        const availableTable = await prisma.table.findFirst({
          where: {
            isActive: true,
            seats: { gte: bookingGuests || 2 },
            bookings: {
              none: {
                date: bookingDateTime,
                time: bookingTime,
                status: { notIn: ['CANCELLED', 'NO_SHOW'] }
              }
            }
          }
        })
        
        if (availableTable) {
          const newBooking = await prisma.booking.create({
            data: {
              tableId: availableTable.id,
              userId: user?.id || null,
              customerName,
              customerPhone,
              customerEmail: user?.email || null,
              date: bookingDateTime,
              time: bookingTime,
              guests: bookingGuests || 2,
              status: 'PENDING',
              comment: `Создано вместе с заказом #${order.id}. ${comment || ''}`
            }
          })
          bookingCreated = true
          bookingId = newBooking.id
          console.log(`Booking created for order #${order.id}, table #${availableTable.number}`)
        } else {
          console.log('No available table for booking')
        }
      }
    }
    
    return NextResponse.json({ 
      order, 
      bookingCreated, 
      bookingId 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании заказа' },
      { status: 500 }
    )
  }
}