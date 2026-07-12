import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// Вспомогательная функция для добавления часов
function addHours(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number)
  const totalMinutes = h * 60 + m + hours * 60
  const newH = Math.floor(totalMinutes / 60)
  const newM = totalMinutes % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

// Проверка пересечения времени
function isTimeOverlap(
  newStart: string,
  newEnd: string,
  existingStart: string,
  existingEnd: string | null
): boolean {
  const existingEndTime = existingEnd || addHours(existingStart, 2)
  return (
    (newStart >= existingStart && newStart < existingEndTime) ||
    (newEnd > existingStart && newEnd <= existingEndTime) ||
    (newStart <= existingStart && newEnd >= existingEndTime) ||
    (newStart >= existingStart && newEnd <= existingEndTime)
  )
}

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
        items: true,
        statusLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            user: {
              select: { id: true, name: true, role: true }
            }
          }
        }
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
      tableId,
      bookingGuests,
      bookingTime,
      bookingEndTime,
      bookingDate,
      isCharity,
      charityRequestId,
      discountId,
      discountAmount,
      isIndividualDiscount
    } = body
    
    const user = await getCurrentUser()
    
    // Валидация
    if (!customerName || !customerPhone || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Заполните все обязательные поля' },
        { status: 400 }
      )
    }
    
    // Проверка доступности блюд
    const dishIds = items.map((item: any) => item.id)
    const availableDishes = await prisma.dish.findMany({
      where: {
        id: { in: dishIds },
        isAvailable: true
      },
      select: { id: true }
    })
    
    const availableIds = new Set(availableDishes.map(d => d.id))
    const unavailableItems = items.filter((item: any) => !availableIds.has(item.id))
    
    if (unavailableItems.length > 0) {
      return NextResponse.json({
        error: `Некоторые блюда временно недоступны: ${unavailableItems.map((i: any) => i.name).join(', ')}`,
        unavailableItems: unavailableItems.map((i: any) => i.name)
      }, { status: 400 })
    }
    
    // 👇 СОХРАНЯЕМ ТИП ЗАКАЗА (orderType)
    const normalizedOrderType = orderType === 'pickup' ? 'PICKUP' : 'DELIVERY'
    const normalizedPaymentMethod = paymentMethod === 'cash' ? 'CASH' : 'CARD'
    
    // 👇 СОЗДАЁМ ЗАКАЗ С ПОДДЕРЖКОЙ ВСЕХ ПОЛЕЙ
    const orderData: any = {
      userId: user?.id || null,
      customerName,
      customerPhone,
      orderType: normalizedOrderType, // 👈 СОХРАНЯЕМ ТИП
      deliveryAddress: normalizedOrderType === 'DELIVERY' ? deliveryAddress : null,
      comment: comment || '',
      total,
      paymentMethod: normalizedPaymentMethod,
      status: isCharity ? 'CONFIRMED' : 'NEW',
      isCharity: isCharity || false,
      paymentStatus: 'PENDING',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 минут на оплату
      items: {
        create: items.map((item: any) => ({
          dishId: item.id,
          dishName: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      }
    }
    
    // 👇 ДОБАВЛЯЕМ СКИДКУ ЕСЛИ ЕСТЬ
    if (discountId && discountAmount) {
      orderData.discountId = parseInt(discountId)
      orderData.discountAmount = parseFloat(discountAmount)
      
      // Обновляем использование скидки
      await prisma.discount.update({
        where: { id: parseInt(discountId) },
        data: { usedCount: { increment: 1 } }
      })
      
      // Если скидка индивидуальная, отмечаем как использованную
      if (isIndividualDiscount && user) {
        await prisma.userDiscount.updateMany({
          where: {
            userId: user.id,
            discountId: parseInt(discountId),
            used: false
          },
          data: { used: true, usedAt: new Date() }
        })
      }
    }
    
    // Создаем заказ
    const order = await prisma.order.create({
      data: orderData,
      include: {
        items: true,
        user: true
      }
    })
    
    // Логируем создание заказа
    await prisma.orderStatusLog.create({
      data: {
        orderId: order.id,
        status: isCharity ? 'CONFIRMED' : 'NEW',
        comment: isCharity ? 'Благотворительный заказ создан' : 'Заказ создан'
      }
    })
    
    // 👇 ЗАПИСЫВАЕМ ИСПОЛЬЗОВАНИЕ СКИДКИ
    if (discountId && discountAmount) {
      try {
        await prisma.discountUsage.create({
          data: {
            discountId: parseInt(discountId),
            userId: user?.id || 'guest',
            orderId: order.id,
            discountValue: parseFloat(discountAmount)
          }
        })
        console.log('✅ Discount usage recorded')
      } catch (error) {
        console.error('Error recording discount usage:', error)
      }
    }
    
    let bookingCreated = false
    let bookingId = null
    let bookingError = null
    
    // Создаем бронирование столика если нужно
    if (needBooking && normalizedOrderType === 'PICKUP' && bookingDate) {
      const bookingDateTime = new Date(bookingDate)
      const endTime = bookingEndTime || addHours(bookingTime, 2)
      
      if (bookingDateTime < new Date()) {
        bookingError = 'Дата бронирования не может быть в прошлом'
      } else if (!tableId) {
        bookingError = 'Не выбран столик для бронирования'
      } else {
        const selectedTable = await prisma.table.findUnique({
          where: { id: tableId }
        })
        
        if (!selectedTable) {
          bookingError = 'Выбранный столик не найден'
        } else if (!selectedTable.isActive) {
          bookingError = 'Выбранный столик временно недоступен'
        } else if (selectedTable.seats < (bookingGuests || 2)) {
          bookingError = `В кабинке ${selectedTable.seats} мест, а вы выбрали ${bookingGuests || 2} гостей`
        } else {
          const existingBookings = await prisma.booking.findMany({
            where: {
              tableId: tableId,
              date: bookingDateTime,
              status: { in: ['CONFIRMED', 'PENDING'] }
            }
          })
          
          let hasConflict = false
          let conflictingBooking = null
          
          for (const booking of existingBookings) {
            const bookingEnd = booking.endTime || addHours(booking.time, 2)
            if (isTimeOverlap(bookingTime, endTime, booking.time, bookingEnd)) {
              hasConflict = true
              conflictingBooking = booking
              break
            }
          }
          
          if (hasConflict && conflictingBooking) {
            bookingError = `Кабинка занята в это время. Бронь: ${conflictingBooking.customerName} (${conflictingBooking.time}${conflictingBooking.endTime ? ` - ${conflictingBooking.endTime}` : ''})`
          } else if (!hasConflict) {
            const newBooking = await prisma.booking.create({
              data: {
                tableId: tableId,
                userId: user?.id || null,
                customerName,
                customerPhone,
                customerEmail: user?.email || null,
                date: bookingDateTime,
                time: bookingTime,
                endTime: endTime,
                guests: bookingGuests || 2,
                status: 'PENDING',
                comment: `Создано вместе с заказом #${order.id}. ${comment || ''}`
              }
            })
            bookingCreated = true
            bookingId = newBooking.id
          }
        }
      }
    }
    
    // Если бронирование не создано, но нужно было — возвращаем ошибку и откатываем заказ
    if (needBooking && normalizedOrderType === 'PICKUP' && bookingDate && !bookingCreated) {
      await prisma.order.delete({ where: { id: order.id } })
      return NextResponse.json({
        error: bookingError || 'Не удалось забронировать столик',
        bookingFailed: true
      }, { status: 409 })
    }
    
    // 👇 БЛАГОТВОРИТЕЛЬНОСТЬ - СОЗДАНИЕ ИСТОРИИ
    if (isCharity && charityRequestId) {
      try {
        const helpRequest = await prisma.helpRequest.findUnique({
          where: { id: charityRequestId },
          include: { beneficiary: true }
        })
        
        if (helpRequest) {
          await prisma.helpRequest.update({
            where: { id: charityRequestId },
            data: {
              orderId: order.id,
              items: items.map((item: any) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
              })),
              total: total,
              status: 'APPROVED'
            }
          })
          
          const existingHistory = await prisma.helpHistory.findFirst({
            where: { helpRequestId: charityRequestId }
          })
          
          if (!existingHistory) {
            await prisma.helpHistory.create({
              data: {
                helpRequestId: charityRequestId,
                beneficiaryId: helpRequest.beneficiaryId,
                userId: user?.id,
                mealTime: helpRequest.mealTime || 'LUNCH',
                amount: total,
                items: items.map((item: any) => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price
                })),
                comment: `Заказ #${order.id}`
              }
            })
            console.log('✅ Charity history created for order #', order.id)
          }
          
          // Обновляем статус нуждающегося
          const completedHelps = await prisma.helpRequest.count({
            where: {
              beneficiaryId: helpRequest.beneficiaryId,
              status: 'COMPLETED'
            }
          })
          
          const activeRequests = await prisma.helpRequest.count({
            where: {
              beneficiaryId: helpRequest.beneficiaryId,
              status: { notIn: ['COMPLETED', 'REJECTED'] }
            }
          })
          
          if (completedHelps >= 3 && activeRequests === 0) {
            await prisma.beneficiary.update({
              where: { id: helpRequest.beneficiaryId },
              data: { 
                isCompleted: true,
                isActive: false
              }
            })
            console.log('✅ Beneficiary marked as completed')
          }
        }
      } catch (charityError) {
        console.error('Error processing charity:', charityError)
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