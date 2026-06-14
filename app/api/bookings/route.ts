import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// Получить бронирования пользователя
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    const where: any = {}
    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      where.date = { gte: startDate, lt: endDate }
    }
    
    if (user && user.role === 'USER') {
      where.userId = user.id
    }
    
    const bookings = await prisma.booking.findMany({
      where,
      include: { table: true },
      orderBy: { date: 'desc' }
    })
    
    return NextResponse.json({ bookings })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка получения бронирований' }, { status: 500 })
  }
}

// Создать бронирование
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { tableId, customerName, customerPhone, customerEmail, date, time, guests, comment } = await request.json()
    
    // Проверяем, свободен ли столик в это время
    const bookingDate = new Date(date)
    const existingBooking = await prisma.booking.findFirst({
      where: {
        tableId,
        date: bookingDate,
        time,
        status: { not: 'CANCELLED' }
      }
    })
    
    if (existingBooking) {
      return NextResponse.json(
        { error: 'Этот столик уже забронирован на выбранное время' },
        { status: 400 }
      )
    }
    
    const booking = await prisma.booking.create({
      data: {
        tableId,
        userId: user?.id || null,
        customerName,
        customerPhone,
        customerEmail,
        date: bookingDate,
        time,
        guests,
        comment,
        status: 'PENDING'
      },
      include: { table: true }
    })
    
    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json({ error: 'Ошибка создания бронирования' }, { status: 500 })
  }
}