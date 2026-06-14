import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'xlsx'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    
    // Строим фильтр по датам
    const where: any = {}
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59')
    }
    if (status && status !== 'all') {
      where.status = status
    }
    
    // Получаем заказы
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })
    
    // Форматируем данные для экспорта
    const exportData: any[] = orders.map(order => ({
      'ID заказа': String(order.id),  // Исправлено: преобразуем в строку
      'Дата': new Date(order.createdAt).toLocaleString('ru-RU'),
      'Клиент': order.customerName,
      'Телефон': order.customerPhone,
      'Тип заказа': order.orderType === 'PICKUP' ? 'Самовывоз' : 'Доставка',
      'Адрес': order.deliveryAddress || '-',
      'Статус': getStatusText(order.status),
      'Товары': order.items.map(i => `${i.dishName} x${i.quantity}`).join(', '),
      'Количество товаров': order.items.reduce((sum, i) => sum + i.quantity, 0),
      'Сумма': `${order.total} ₽`,
      'Оплата': order.paymentMethod === 'CASH' ? 'Наличные' : 'Карта',
      'Комментарий': order.comment || '-',
    }))
    
    // Добавляем строку с итогами
    const totalSum = orders.reduce((sum, o) => sum + o.total, 0)
    const totalItems = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0)
    
    exportData.push({
      'ID заказа': 'ИТОГО:',
      'Дата': '',
      'Клиент': '',
      'Телефон': '',
      'Тип заказа': '',
      'Адрес': '',
      'Статус': '',
      'Товары': '',
      'Количество товаров': totalItems,
      'Сумма': `${totalSum} ₽`,
      'Оплата': '',
      'Комментарий': '',
    })
    
    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Заказы')
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename=orders_${new Date().toISOString().split('T')[0]}.xlsx`
        }
      })
    } else {
      // CSV формат
      const csvRows = [
        Object.keys(exportData[0]).join(','),
        ...exportData.map(row => Object.values(row).map(v => `"${v}"`).join(','))
      ]
      const csv = csvRows.join('\n')
      
      return new NextResponse('\uFEFF' + csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=orders_${new Date().toISOString().split('T')[0]}.csv`
        }
      })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Ошибка экспорта' }, { status: 500 })
  }
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    NEW: '🆕 Новый',
    CALLED: '📞 Позвонили',
    CONFIRMED: '✅ Подтвержден',
    PREPARING: '🍳 Готовится',
    READY: '📦 Готов',
    DELIVERING: '🚚 В пути',
    COMPLETED: '✅ Выполнен',
    CANCELLED: '❌ Отменен',
    REJECTED: '⚠️ Отклонен'
  }
  return statusMap[status] || status
}