import { createHash, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Единственное место, где клиентский заказ может стать PAID / CONFIRMED.
 * Браузер и бот сюда не ходят: только платёжная система (или наш сервер)
 * с заголовком секрета PAYMENT_WEBHOOK_SECRET.
 *
 * Заголовки (любой из двух):
 *   X-Webhook-Secret: <секрет>
 *   Authorization: Bearer <секрет>
 *
 * Тело: { "orderId": 123 }
 */
function readProvidedSecret(request: NextRequest): string | null {
  const headerSecret = request.headers.get('x-webhook-secret')?.trim()
  if (headerSecret) return headerSecret

  const auth = request.headers.get('authorization')
  if (auth?.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice(7).trim()
    if (token) return token
  }

  return null
}

function secretsMatch(provided: string, expected: string): boolean {
  // Сравниваем SHA-256, чтобы timingSafeEqual всегда видел буферы одной длины
  const providedHash = createHash('sha256').update(provided).digest()
  const expectedHash = createHash('sha256').update(expected).digest()
  return timingSafeEqual(providedHash, expectedHash) && provided.length === expected.length
}

export async function POST(request: NextRequest) {
  try {
    const expected = process.env.PAYMENT_WEBHOOK_SECRET
    if (!expected) {
      console.error('PAYMENT_WEBHOOK_SECRET is not set — webhook disabled')
      return NextResponse.json(
        { error: 'Вебхук оплаты не настроен' },
        { status: 503 }
      )
    }

    const provided = readProvidedSecret(request)
    if (!provided || !secretsMatch(provided, expected)) {
      return NextResponse.json({ error: 'Неверный секрет вебхука' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const orderId = Number(body?.orderId)

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json({ error: 'Некорректный orderId' }, { status: 400 })
    }

    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, paymentStatus: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 })
    }

    // Повторный вебхук — не трогаем уже оплаченный заказ
    if (existing.paymentStatus === 'PAID' || existing.paymentStatus === 'CONFIRMED') {
      return NextResponse.json({ order: existing, alreadyProcessed: true })
    }

    if (existing.status === 'CANCELLED' || existing.status === 'REJECTED') {
      return NextResponse.json(
        { error: 'Нельзя подтвердить оплату отменённого заказа' },
        { status: 409 }
      )
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        isReminded: true,
      },
    })

    await prisma.orderStatusLog.create({
      data: {
        orderId,
        status: 'CONFIRMED',
        comment: 'Оплата подтверждена платёжным вебхуком',
      },
    })

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Payment webhook error:', error)
    return NextResponse.json({ error: 'Ошибка вебхука оплаты' }, { status: 500 })
  }
}
