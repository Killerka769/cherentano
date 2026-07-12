import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

function addHours(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number)
  const totalMinutes = h * 60 + m + hours * 60
  const newH = Math.floor(totalMinutes / 60)
  const newM = totalMinutes % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const totalMinutes = h * 60 + m + minutes
  const newH = Math.floor(totalMinutes / 60)
  const newM = totalMinutes % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

function isTimeOverlap(
  newStart: string,
  newEnd: string,
  existingStart: string,
  existingEnd: string | null
): boolean {
  const existingEndTime = existingEnd || addHours(existingStart, 2)
  
  const newStartWithBuffer = addMinutes(newStart, -15)
  const newEndWithBuffer = addMinutes(newEnd, 15)
  
  return (
    (newStartWithBuffer >= existingStart && newStartWithBuffer < existingEndTime) ||
    (newEndWithBuffer > existingStart && newEndWithBuffer <= existingEndTime) ||
    (newStartWithBuffer <= existingStart && newEndWithBuffer >= existingEndTime) ||
    (newStartWithBuffer >= existingStart && newEndWithBuffer <= existingEndTime)
  )
}

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
    
    const bookingDate = new Date(date)
    const bookingEndTime = endTime || addHours(time, 2)
    
    // Проверяем существующие брони на этот столик и дату
    const existingBookings = await prisma.booking.findMany({
      where: {
        tableId,
        date: bookingDate,
        status: { in: ['CONFIRMED', 'PENDING'] }
      }
    })
    
    // Проверяем пересечение времени (с 15-минутным буфером)
    const conflictingBookings = []
    for (const booking of existingBookings) {
      const bookingEnd = booking.endTime || addHours(booking.time, 2)
      if (isTimeOverlap(time, bookingEndTime, booking.time, bookingEnd)) {
        conflictingBookings.push({
          time: booking.time,
          endTime: booking.endTime,
          customerName: booking.customerName
        })
      }
    }
    
    if (conflictingBookings.length > 0) {
      return NextResponse.json({
        error: 'Столик уже занят в это время (учитывается 15-минутный перерыв)',
        conflictingBookings
      }, { status: 409 })
    }
    
    // 👇 СОЗДАЕМ БРОНЬ
    const requiredAmount = 1000
    const paidAmountNum = parseFloat(paidAmount) || 0
    
    const noShowTime = new Date(bookingDate)
    const [hours, minutes] = time.split(':').map(Number)
    noShowTime.setHours(hours + 1, minutes, 0, 0) // Через 1 час после начала
    
    // 👇 ФОРМИРУЕМ ДАННЫЕ ДЛЯ СОЗДАНИЯ
    const bookingData: any = {
      tableId,
      userId: user.id,
      customerName,
      customerPhone,
      customerEmail,
      date: bookingDate,
      time,
      endTime: bookingEndTime,
      guests: guests || 2,
      comment,
      status: 'PENDING',
      noShowTime: noShowTime,
    }
    
    // 👇 ДОБАВЛЯЕМ ПОЛЯ ОПЛАТЫ, ЕСЛИ ЕСТЬ
    if (paidAmountNum > 0) {
      bookingData.paidAmount = paidAmountNum
      bookingData.paymentData = {
        amount: paidAmountNum,
        method: paymentMethod || 'ONLINE',
        paidAt: new Date().toISOString()
      }
    }
    
    const booking = await prisma.booking.create({
      data: bookingData,
      include: { table: true }
    })
    
    return NextResponse.json({ 
      booking,
      message: paidAmountNum >= requiredAmount 
        ? 'Бронирование создано. Ожидайте подтверждения менеджера.'
        : 'Бронирование создано, но требуется оплата 1000 ₽ для подтверждения.'
    }, { status: 201 })
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json({ error: 'Ошибка создания бронирования' }, { status: 500 })
  }
}