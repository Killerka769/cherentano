import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Получаем ВСЕ завершённые благотворительные заказы
    const charityOrders = await prisma.order.findMany({
      where: {
        isCharity: true,
        status: 'COMPLETED'
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
    
    const history = charityOrders.map(order => ({
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
    
    return NextResponse.json({ history })
  } catch (error) {
    console.error('Error fetching all help history:', error)
    return NextResponse.json({ error: 'Ошибка получения общей истории' }, { status: 500 })
  }
}