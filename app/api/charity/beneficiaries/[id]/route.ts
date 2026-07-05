import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const { id } = await params
    
    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id },
      include: {
        helpRequests: {
          where: {
            status: 'COMPLETED'
          },
          orderBy: { deliveredAt: 'desc' },
          take: 5
        }
      }
    })
    
    if (!beneficiary) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
    }
    
    if (!beneficiary.isActive || beneficiary.isCompleted) {
      return NextResponse.json({ error: 'Уже получил помощь' }, { status: 400 })
    }
    
    return NextResponse.json({ beneficiary })
  } catch (error) {
    console.error('Error fetching beneficiary:', error)
    return NextResponse.json({ error: 'Ошибка получения данных' }, { status: 500 })
  }
}