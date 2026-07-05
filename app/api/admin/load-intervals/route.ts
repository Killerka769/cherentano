import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - получить все интервалы (для админа)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    
    const targetDate = date ? new Date(date) : new Date()
    targetDate.setHours(0, 0, 0, 0)
    
    const where: any = {
      date: {
        gte: targetDate,
        lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
      }
    }
    
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false
    
    const intervals = await prisma.loadInterval.findMany({
      where,
      orderBy: { startTime: 'asc' }
    })
    
    return NextResponse.json({ intervals })
  } catch (error) {
    console.error('Error fetching load intervals:', error)
    return NextResponse.json({ error: 'Ошибка получения интервалов' }, { status: 500 })
  }
}

// POST - создать интервал
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { date, startTime, endTime, loadLevel, comment } = await request.json()
    
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)
    
    // Проверка на пересечение с существующими интервалами
    const existing = await prisma.loadInterval.findFirst({
      where: {
        date: targetDate,
        isActive: true,
        OR: [
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime }
          },
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime }
          },
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime }
          }
        ]
      }
    })
    
    if (existing) {
      return NextResponse.json({
        error: 'Интервал пересекается с существующим',
        conflictingInterval: existing
      }, { status: 409 })
    }
    
    const interval = await prisma.loadInterval.create({
      data: {
        date: targetDate,
        startTime,
        endTime,
        loadLevel,
        comment: comment || null,
        isActive: true
      }
    })
    
    return NextResponse.json({ interval }, { status: 201 })
  } catch (error) {
    console.error('Error creating load interval:', error)
    return NextResponse.json({ error: 'Ошибка создания интервала' }, { status: 500 })
  }
}

// PUT - обновить интервал
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { id, startTime, endTime, loadLevel, comment, isActive } = await request.json()
    
    const interval = await prisma.loadInterval.update({
      where: { id },
      data: {
        startTime,
        endTime,
        loadLevel,
        comment: comment || null,
        isActive,
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json({ interval })
  } catch (error) {
    console.error('Error updating load interval:', error)
    return NextResponse.json({ error: 'Ошибка обновления интервала' }, { status: 500 })
  }
}

// DELETE - удалить интервал
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    await prisma.loadInterval.delete({
      where: { id: parseInt(id!) }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting load interval:', error)
    return NextResponse.json({ error: 'Ошибка удаления интервала' }, { status: 500 })
  }
}