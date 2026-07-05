import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    const { id: userId } = await params
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        phoneVerified: true,
        createdAt: true,
        birthDate: true,  // 👈 Добавляем ДР
      }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }
    
    // Публичная информация (доступна всем)
    const publicUser = {
      id: user.id,
      name: user.name,
      role: user.role,
      phoneVerified: user.phoneVerified,
      createdAt: user.createdAt,
      birthDate: user.birthDate,
    }
    
    // Добавляем статистику (доступна всем)
    const orders = await prisma.order.findMany({
      where: { userId: user.id, status: 'COMPLETED' },
      select: { total: true }
    })
    
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: { userId: user.id }
      },
      select: { dishName: true, quantity: true }
    })
    
    const dishCount: Record<string, number> = {}
    orderItems.forEach(item => {
      dishCount[item.dishName] = (dishCount[item.dishName] || 0) + item.quantity
    })
    const favoriteDish = Object.entries(dishCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
    
    const totalSpent = orders.reduce((sum, o) => sum + o.total, 0)
    const totalOrders = orders.length
    
    // Если пользователь авторизован и это его профиль или он админ/менеджер - добавляем личные данные
    const isOwner = currentUser?.id === user.id
    const isAdminOrManager = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER'
    
    if (isOwner || isAdminOrManager) {
      const fullUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          phone: true,
        }
      })
      
      return NextResponse.json({
        user: {
          ...publicUser,
          email: fullUser?.email,
          phone: fullUser?.phone,
          totalSpent,
          totalOrders,
          favoriteDish,
          averageCheck: totalOrders > 0 ? totalSpent / totalOrders : 0
        }
      })
    }
    
    // Публичный профиль (без email и телефона)
    return NextResponse.json({
      user: {
        ...publicUser,
        totalSpent,
        totalOrders,
        favoriteDish,
        averageCheck: totalOrders > 0 ? totalSpent / totalOrders : 0
      }
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Ошибка получения пользователя' }, { status: 500 })
  }
}