import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET — клиенту можно только СМОТРЕТЬ свой неоплаченный заказ.
// Менять paymentStatus / status здесь нельзя.
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const pendingOrder = await prisma.order.findFirst({
      where: {
        userId: user.id,
        paymentStatus: 'PENDING',
        status: 'NEW',
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000),
        },
      },
      include: {
        items: true,
      },
    })

    return NextResponse.json({ order: pendingOrder })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

/**
 * POST больше не отмечает заказ как оплаченный.
 *
 * Раньше любой залогиненный пользователь (и бот после /api/auth/register)
 * слал { orderId } и получал paymentStatus=PAID и status=CONFIRMED без денег.
 *
 * Статус оплаты меняет только POST /api/payments/webhook с секретом.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Статус оплаты меняется только через платёжный вебхук' },
    { status: 403 }
  )
}
