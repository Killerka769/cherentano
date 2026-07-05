import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const body = await request.json()
    const { beneficiaryId, mealTime } = body
    
    if (!beneficiaryId || !mealTime) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 })
    }
    
    const existingRequest = await prisma.helpRequest.findFirst({
      where: {
        beneficiaryId,
        userId: user.id,
        status: { in: ['PENDING', 'APPROVED', 'PREPARING', 'DELIVERING'] }
      }
    })
    
    if (existingRequest) {
      return NextResponse.json(
        { error: 'У вас уже есть активная заявка' },
        { status: 400 }
      )
    }
    
    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: beneficiaryId }
    })
    
    if (!beneficiary || !beneficiary.isActive || beneficiary.isCompleted) {
      return NextResponse.json(
        { error: 'Этот человек уже получил помощь' },
        { status: 400 }
      )
    }
    
    const newRequest = await prisma.helpRequest.create({
      data: {
        beneficiaryId,
        userId: user.id,
        mealTime: mealTime,
        status: 'PENDING',
        items: [],
        total: 0
      }
    })
    
    return NextResponse.json({ request: newRequest }, { status: 201 })
  } catch (error) {
    console.error('Error creating help request:', error)
    return NextResponse.json({ error: 'Ошибка создания заявки' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const where: any = { userId: user.id }
    if (status && status !== 'all') {
      where.status = status
    }
    
    const requests = await prisma.helpRequest.findMany({
      where,
      include: {
        beneficiary: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching help requests:', error)
    return NextResponse.json({ error: 'Ошибка получения заявок' }, { status: 500 })
  }
}