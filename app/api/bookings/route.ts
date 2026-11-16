import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { sendBookingNotification } from '@/lib/email'
import {
  addHours,
  assertCabinAvailable,
  BookingConflictError,
  BookingValidationError,
  getBookingDateStart,
  getNoShowTime,
  isBookingDateTimeInPast,
} from '@/lib/booking-utils'

// GET - получить бронирования пользователя
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    const where: any = { userId: user.id }
    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      where.date = { gte: startDate, lt: endDate }
    }
    
    const bookings = await prisma.booking.findMany({
      where,
      include: { table: true },
      orderBy: { date: 'desc' }
    })
    
    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Ошибка получения бронирований' },
      { status: 500 }
    )
  }
}

// POST - создать бронирование
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const { 
      tableId, 
      customerName, 
      customerPhone, 
      customerEmail, 
      date, 
      time, 
      endTime, 
      guests, 
      comment,
      paidAmount,
      paymentMethod
    } = await request.json()
    
    if (!tableId || !customerName || !customerPhone || !date || !time) {
      return NextResponse.json({ error: 'Заполните все обязательные поля' }, { status: 400 })
    }
    
    const bookingDate = getBookingDateStart(date)
    const bookingEndTime = endTime || addHours(time, 2)
    const guestCount = guests || 2

    if (isBookingDateTimeInPast(bookingDate, time)) {
      return NextResponse.json({ error: 'Дата бронирования не может быть в прошлом' }, { status: 400 })
    }

    const requiredAmount = 1000
    const paidAmountNum = parseFloat(paidAmount) || 0

    const booking = await prisma.$transaction(async (tx) => {
      await assertCabinAvailable(tx, {
        tableId,
        date: bookingDate,
        time,
        endTime: bookingEndTime,
        guests: guestCount,
      })

      const bookingData: any = {
        tableId,
        userId: user.id,
        customerName,
        customerPhone,
        customerEmail,
        date: bookingDate,
        time,
        endTime: bookingEndTime,
        guests: guestCount,
        comment,
        status: 'PENDING',
        noShowTime: getNoShowTime(bookingDate, time),
      }

      if (paidAmountNum > 0) {
        bookingData.paidAmount = paidAmountNum
        bookingData.paymentData = {
          amount: paidAmountNum,
          method: paymentMethod || 'ONLINE',
          paidAt: new Date().toISOString()
        }
      }

      return tx.booking.create({
        data: bookingData,
        include: { table: true }
      })
    })

    const emailResult = await sendBookingNotification({
      id: booking.id,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail,
      tableNumber: booking.table.number,
      tableName: booking.table.name,
      date: booking.date,
      time: booking.time,
      guests: booking.guests,
      comment: booking.comment,
    })

    const emailSent = Boolean(emailResult?.success)
    if (!emailSent) {
      console.error('❌ Email о бронировании не отправлен, bookingId:', booking.id, emailResult?.error)
    }
    
    return NextResponse.json({ 
      booking,
      emailSent,
      message: paidAmountNum >= requiredAmount 
        ? 'Бронирование создано. Ожидайте подтверждения менеджера.'
        : 'Бронирование создано, но требуется оплата 1000 ₽ для подтверждения.'
    }, { status: 201 })
  } catch (error) {
    if (error instanceof BookingConflictError) {
      return NextResponse.json({
        error: error.message,
        conflictingBookings: error.conflictingBookings,
      }, { status: 409 })
    }

    if (error instanceof BookingValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Booking error:', error)
    return NextResponse.json({ error: 'Ошибка создания бронирования' }, { status: 500 })
  }
}