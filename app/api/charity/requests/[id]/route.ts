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
    
    const requestData = await prisma.helpRequest.findUnique({
      where: { id },
      include: {
        beneficiary: true,
        user: {
          select: { name: true, email: true }
        }
      }
    })
    
    if (!requestData) {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 })
    }
    
    return NextResponse.json({ request: requestData })
  } catch (error) {
    console.error('Error fetching help request:', error)
    return NextResponse.json({ error: 'Ошибка получения заявки' }, { status: 500 })
  }
}