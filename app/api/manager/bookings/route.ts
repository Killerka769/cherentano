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
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    
    const where: any = {}
    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      where.date = { gte: startDate, lt: endDate }
    }
    if (status && status !== 'all') {
      where.status = status
    }
    
    const bookings = await prisma.booking.findMany({
      where,
      include: { 
        table: true,
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { time: 'asc' }
    })
    
    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Ошибка получения бронирований' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { bookingId, status, comment } = await request.json()
    
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status,
        confirmedBy: user.id,
        comment: comment || undefined
      },
      include: { table: true }
    })
    
    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json({ error: 'Ошибка обновления бронирования' }, { status: 500 })
  }
}