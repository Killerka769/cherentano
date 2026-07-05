import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    // Получаем историю из таблицы HelpHistory
    const history = await prisma.helpHistory.findMany({
      where: {
        // Показываем все записи, где есть пользователь
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
    
    // Если в HelpHistory нет записей, пробуем получить из заказов
    if (history.length === 0) {
      const charityOrders = await prisma.order.findMany({
        where: {
          isCharity: true,
          status: 'COMPLETED',
          userId: user.id
        },
        include: {
          user: {
            select: { name: true }
          },
          items: true
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      })
      
      // Если есть благотворительные заказы, формируем из них историю
      if (charityOrders.length > 0) {
        const ordersHistory = charityOrders.map(order => ({
          id: order.id.toString(),
          beneficiaryId: order.deliveryAddress || 'Не указан',
          userId: order.userId,
          mealTime: order.comment?.includes('Завтрак') ? 'BREAKFAST' : 
                    order.comment?.includes('Ужин') ? 'DINNER' : 'LUNCH',
          amount: order.total,
          items: order.items.map((item: any) => ({
            name: item.dishName,
            quantity: item.quantity,
            price: item.price
          })),
          createdAt: order.createdAt,
          user: order.user ? { name: order.user.name } : null,
          beneficiary: {
            id: 'unknown',
            name: order.comment?.split('для ')[1]?.split(' (')[0] || 'Нуждающийся',
            imageUrl: null,
            address: order.deliveryAddress || 'Адрес не указан'
          }
        }))
        
        return NextResponse.json({ history: ordersHistory })
      }
    }
    
    // Форматируем историю для отображения
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