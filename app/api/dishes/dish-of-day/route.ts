import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const dishesOfDay = await prisma.dishOfDay.findMany({
      where: {
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        dish: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        dish: {
          sortOrder: 'asc'
        }
      }
    })
    
    return NextResponse.json({ dishesOfDay })
  } catch (error) {
    console.error('Error fetching dishes of day:', error)
    return NextResponse.json({ error: 'Ошибка получения блюд дня' }, { status: 500 })
  }
}