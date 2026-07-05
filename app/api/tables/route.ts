import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tables = await prisma.table.findMany({
      where: { isActive: true },
      include: {
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'PENDING'] },
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          },
          select: {
            id: true,
            date: true,
            time: true,
            endTime: true,
            status: true,
            customerName: true
          }
        }
      },
      orderBy: { number: 'asc' }
    })
    
    return NextResponse.json({ tables })
  } catch (error) {
    console.error('Error fetching tables:', error)
    return NextResponse.json({ error: 'Ошибка получения столов' }, { status: 500 })
  }
}