import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    // Получаем историю только для текущего пользователя
    const history = await prisma.helpHistory.findMany({
      where: {
        userId: user.id
      },
      include: {
        user: {
          select: { name: true }
        },
        beneficiary: {
          select: { 
            id: true,
            name: true, 
            imageUrl: true,
            address: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    
    const formattedHistory = history.map(item => ({
      id: item.id,
      beneficiaryId: item.beneficiaryId,
      userId: item.userId,
      mealTime: item.mealTime || 'LUNCH',
      amount: item.amount || 0,
      items: item.items || [],
      createdAt: item.createdAt,
      user: item.user ? { name: item.user.name } : null,
      beneficiary: {
        name: item.beneficiary?.name || 'Нуждающийся',
        imageUrl: item.beneficiary?.imageUrl || null,
        address: item.beneficiary?.address || 'Адрес не указан'
      }
    }))
    
    return NextResponse.json({ history: formattedHistory })
  } catch (error) {
    console.error('Error fetching help history:', error)
    return NextResponse.json({ error: 'Ошибка получения истории' }, { status: 500 })
  }
}