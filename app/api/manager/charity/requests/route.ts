import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - получить все заявки на помощь
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }
    
    const requests = await prisma.helpRequest.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, phone: true }
        },
        beneficiary: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching charity requests:', error)
    return NextResponse.json({ error: 'Ошибка получения заявок' }, { status: 500 })
  }
}

// PATCH - обновить статус заявки
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { requestId, status, comment } = await request.json()
    
    if (!requestId || !status) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 })
    }
    
    const updatedRequest = await prisma.helpRequest.update({
      where: { id: requestId },
      data: {
        status,
        statusComment: comment || undefined,
        ...(status === 'COMPLETED' ? { deliveredAt: new Date() } : {})
      },
      include: {
        user: {
          select: { id: true, name: true, phone: true }
        },
        beneficiary: true
      }
    })
    
    return NextResponse.json({ request: updatedRequest })
  } catch (error) {
    console.error('Error updating charity request:', error)
    return NextResponse.json({ error: 'Ошибка обновления заявки' }, { status: 500 })
  }
}