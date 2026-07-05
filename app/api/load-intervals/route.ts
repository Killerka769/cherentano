import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    const targetDate = date ? new Date(date) : new Date()
    targetDate.setHours(0, 0, 0, 0)
    
    const intervals = await prisma.loadInterval.findMany({
      where: {
        date: {
          gte: targetDate,
          lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
        },
        isActive: true
      },
      orderBy: { startTime: 'asc' }
    })
    
    return NextResponse.json({ intervals })
  } catch (error) {
    console.error('Error fetching load intervals:', error)
    return NextResponse.json({ error: 'Ошибка получения интервалов загруженности' }, { status: 500 })
  }
}