import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    // Статистика за сегодня
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const [
      totalOrders,
      todayOrders,
      totalUsers,
      totalRevenue,
      todayRevenue,
      ordersByStatus,
      popularDishes,
      recentOrders
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.user.count(),
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: today, lt: tomorrow } },
        _sum: { total: true }
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: true
      }),
      prisma.orderItem.groupBy({
        by: ['dishName'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { items: true }
      })
    ])
    
    return NextResponse.json({
      totalOrders,
      todayOrders,
      totalUsers,
      totalRevenue: totalRevenue._sum.total || 0,
      todayRevenue: todayRevenue._sum.total || 0,
      ordersByStatus,
      popularDishes,
      recentOrders
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Ошибка получения статистики' }, { status: 500 })
  }
}