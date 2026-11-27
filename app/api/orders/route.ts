import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { sendOrderNotification } from '@/lib/email'
import {
  addHours,
  assertCabinAvailable,
  BookingConflictError,
  BookingValidationError,
  getBookingDateStart,
  getNoShowTime,
  isBookingDateTimeInPast,
} from '@/lib/booking-utils'

const CHARITY_DELIVERY_FEE = 500

type OrderLine = {
  dishId: number
  dishName: string
  quantity: number
  price: number
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
        discount: true, 
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
  // Частоту с одного IP режет middleware → lib/rate-limit.ts (10 запросов/мин)
  try {
    const body = await request.json()
    const { 
      customerName, 
      customerPhone, 
      orderType, 
      deliveryAddress, 
      comment, 
      items, 
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
      isIndividualDiscount
    } = body
    
    const user = await getCurrentUser()
    
    if (!customerName || !customerPhone || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Заполните все обязательные поля' },
        { status: 400 }
      )
    }

    const dishIds = items.map((item: { id: number }) => item.id)
    const dbDishes = await prisma.dish.findMany({
      where: { id: { in: dishIds } },
      select: { id: true, name: true, price: true, isAvailable: true }
    })

    const dishesById = new Map(dbDishes.map((dish) => [dish.id, dish]))
    const unavailableItems = items.filter((item: { id: number; name: string }) => {
      const dish = dishesById.get(item.id)
      return !dish || !dish.isAvailable
    })

    if (unavailableItems.length > 0) {
      return NextResponse.json({
        error: `Некоторые блюда временно недоступны: ${unavailableItems.map((i: { name: string }) => i.name).join(', ')}`,
        unavailableItems: unavailableItems.map((i: { name: string }) => i.name)
      }, { status: 400 })
    }

    const invalidQuantity = items.find((item: { quantity: number }) => {
      const quantity = Number(item.quantity)
      return !Number.isFinite(quantity) || quantity < 1
    })
    if (invalidQuantity) {
      return NextResponse.json({ error: 'Некорректное количество блюд' }, { status: 400 })
    }

    const orderItems: OrderLine[] = items.map((item: { id: number; quantity: number }) => {
      const dish = dishesById.get(item.id)!
      return {
        dishId: dish.id,
        dishName: dish.name,
        quantity: Math.floor(Number(item.quantity)),
        price: dish.price,
      }
    })

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const charityFee = isCharity ? CHARITY_DELIVERY_FEE : 0

    const normalizedOrderType = orderType === 'pickup' ? 'PICKUP' : 'DELIVERY'
    const normalizedPaymentMethod = paymentMethod === 'cash' ? 'CASH' : 'CARD'
    const wantsBooking = Boolean(needBooking && normalizedOrderType === 'PICKUP' && bookingDate)
    const parsedDiscountId = discountId ? parseInt(discountId, 10) : NaN
    const hasDiscount = Number.isInteger(parsedDiscountId)

    let bookingDateStart: Date | null = null
    let bookingEnd = ''
    let guestCount = 2

    if (wantsBooking) {
      if (!tableId) {
        return NextResponse.json({
          error: 'Не выбран столик для бронирования',
          bookingFailed: true,
        }, { status: 409 })
      }
      if (!bookingTime) {
        return NextResponse.json({
          error: 'Не указано время бронирования',
          bookingFailed: true,
        }, { status: 409 })
      }

      bookingDateStart = getBookingDateStart(bookingDate)
      bookingEnd = bookingEndTime || addHours(bookingTime, 2)
      guestCount = bookingGuests || 2

      if (isBookingDateTimeInPast(bookingDateStart, bookingTime)) {
        return NextResponse.json({
          error: 'Дата бронирования не может быть в прошлом',
          bookingFailed: true,
        }, { status: 409 })
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      let bookingTable = null

      if (wantsBooking && bookingDateStart) {
        bookingTable = await assertCabinAvailable(tx, {
          tableId,
          date: bookingDateStart,
          time: bookingTime,
          endTime: bookingEnd,
          guests: guestCount,
        })
      }

      let computedDiscountAmount = 0
      let discountRecord: {
        id: number
        code: string
        name: string
        type: string
        value: number
        minOrderAmount: number | null
        maxDiscount: number | null
        usageLimit: number | null
        usedCount: number
        isActive: boolean
        isIndividual: boolean
      } | null = null

      if (hasDiscount) {
        await tx.$queryRaw`SELECT id FROM "Discount" WHERE id = ${parsedDiscountId} FOR UPDATE`

        discountRecord = await tx.discount.findUnique({
          where: { id: parsedDiscountId },
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            value: true,
            minOrderAmount: true,
            maxDiscount: true,
            usageLimit: true,
            usedCount: true,
            isActive: true,
            isIndividual: true,
          },
        })

        if (!discountRecord || !discountRecord.isActive) {
          throw new BookingValidationError('Скидка недоступна')
        }

        if (discountRecord.usageLimit != null && discountRecord.usedCount >= discountRecord.usageLimit) {
          throw new BookingValidationError('Лимит использования скидки исчерпан')
        }

        if (discountRecord.minOrderAmount && subtotal < discountRecord.minOrderAmount) {
          throw new BookingValidationError(
            `Минимальная сумма заказа для скидки: ${discountRecord.minOrderAmount} ₽`
          )
        }

        if (discountRecord.isIndividual) {
          if (!user) {
            throw new BookingValidationError('Индивидуальная скидка доступна только авторизованным пользователям')
          }

          const userDiscount = await tx.userDiscount.findFirst({
            where: {
              userId: user.id,
              discountId: parsedDiscountId,
              used: false,
            },
          })

          if (!userDiscount) {
            throw new BookingValidationError('Эта скидка не доступна вам')
          }
        }

        if (discountRecord.type === 'PERCENT') {
          computedDiscountAmount = (subtotal * discountRecord.value) / 100
        } else {
          computedDiscountAmount = discountRecord.value
        }

        if (discountRecord.maxDiscount && computedDiscountAmount > discountRecord.maxDiscount) {
          computedDiscountAmount = discountRecord.maxDiscount
        }

        computedDiscountAmount = Math.min(subtotal, Math.round(computedDiscountAmount * 100) / 100)
      }

      const computedTotal = Math.max(0, subtotal - computedDiscountAmount + charityFee)

      const order = await tx.order.create({
        data: {
          userId: user?.id || null,
          customerName,
          customerPhone,
          orderType: normalizedOrderType,
          deliveryAddress: normalizedOrderType === 'DELIVERY' ? deliveryAddress : null,
          comment: comment || '',
          total: computedTotal,
          paymentMethod: normalizedPaymentMethod,
          status: 'NEW',
          isCharity: isCharity || false,
          paymentStatus: 'PENDING',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          ...(hasDiscount && computedDiscountAmount > 0
            ? {
                discountId: parsedDiscountId,
                discountAmount: computedDiscountAmount,
              }
            : {}),
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
          user: true,
          discount: true,
        },
      })

      await tx.orderStatusLog.create({
        data: {
          orderId: order.id,
          status: 'NEW',
          comment: isCharity
            ? 'Благотворительный заказ создан, ожидает оплаты'
            : 'Заказ создан, ожидает оплаты',
        },
      })

      if (hasDiscount && computedDiscountAmount > 0 && discountRecord) {
        await tx.discount.update({
          where: { id: parsedDiscountId },
          data: { usedCount: { increment: 1 } },
        })

        if ((isIndividualDiscount || discountRecord.isIndividual) && user) {
          await tx.userDiscount.updateMany({
            where: {
              userId: user.id,
              discountId: parsedDiscountId,
              used: false,
            },
            data: { used: true, usedAt: new Date() },
          })
        }

        if (user) {
          await tx.discountUsage.create({
            data: {
              discountId: parsedDiscountId,
              userId: user.id,
              orderId: order.id,
              discountValue: computedDiscountAmount,
            },
          })
        }
      }

      let bookingCreated = false
      let bookingId: string | null = null

      if (wantsBooking && bookingDateStart) {
        const newBooking = await tx.booking.create({
          data: {
            tableId,
            userId: user?.id || null,
            customerName,
            customerPhone,
            customerEmail: user?.email || null,
            date: bookingDateStart,
            time: bookingTime,
            endTime: bookingEnd,
            guests: guestCount,
            status: 'PENDING',
            noShowTime: getNoShowTime(bookingDateStart, bookingTime),
            comment: `Создано вместе с заказом #${order.id}. ${comment || ''}`,
          },
        })
        bookingCreated = true
        bookingId = newBooking.id
      }

      if (isCharity && charityRequestId) {
        const helpRequest = await tx.helpRequest.findUnique({
          where: { id: charityRequestId },
          include: { beneficiary: true },
        })

        if (helpRequest) {
          const charityItems = orderItems.map((item) => ({
            name: item.dishName,
            quantity: item.quantity,
            price: item.price,
          }))

          await tx.helpRequest.update({
            where: { id: charityRequestId },
            data: {
              orderId: order.id,
              items: charityItems,
              total: computedTotal,
              status: 'APPROVED',
            },
          })

          const existingHistory = await tx.helpHistory.findFirst({
            where: { helpRequestId: charityRequestId },
          })

          if (!existingHistory) {
            await tx.helpHistory.create({
              data: {
                helpRequestId: charityRequestId,
                beneficiaryId: helpRequest.beneficiaryId,
                userId: user?.id,
                mealTime: helpRequest.mealTime || 'LUNCH',
                amount: computedTotal,
                items: charityItems,
                comment: `Заказ #${order.id}`,
              },
            })
          }

          const completedHelps = await tx.helpRequest.count({
            where: {
              beneficiaryId: helpRequest.beneficiaryId,
              status: 'COMPLETED',
            },
          })

          const activeRequests = await tx.helpRequest.count({
            where: {
              beneficiaryId: helpRequest.beneficiaryId,
              status: { notIn: ['COMPLETED', 'REJECTED'] },
            },
          })

          if (completedHelps >= 3 && activeRequests === 0) {
            await tx.beneficiary.update({
              where: { id: helpRequest.beneficiaryId },
              data: {
                isCompleted: true,
                isActive: false,
              },
            })
          }
        }
      }

      return { order, bookingCreated, bookingId }
    })

    const { order, bookingCreated, bookingId } = result

    const emailResult = await sendOrderNotification({
      id: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      orderType: order.orderType,
      deliveryAddress: order.deliveryAddress,
      total: order.total,
      items: order.items,
      comment: order.comment,
      createdAt: order.createdAt,
      isCharity: order.isCharity || false,
      discountAmount: order.discountAmount || 0,
      discountCode: order.discount?.code || null,
      discountName: order.discount?.name || null,
    })

    const emailSent = Boolean(emailResult?.success)
    if (!emailSent) {
      console.error('❌ Ошибка отправки email, orderId:', order.id, emailResult?.error)
    }

    return NextResponse.json({
      order,
      bookingCreated,
      bookingId,
      emailSent,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof BookingConflictError) {
      return NextResponse.json({
        error: error.message,
        bookingFailed: true,
        conflictingBookings: error.conflictingBookings,
      }, { status: 409 })
    }

    if (error instanceof BookingValidationError) {
      const isBookingIssue =
        error.message.includes('столик') ||
        error.message.includes('Кабинка') ||
        error.message.includes('бронир')

      return NextResponse.json({
        error: error.message,
        ...(isBookingIssue ? { bookingFailed: true } : {}),
      }, { status: isBookingIssue ? 409 : 400 })
    }

    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании заказа' },
      { status: 500 }
    )
  }
}
