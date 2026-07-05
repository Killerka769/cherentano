import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - получить всех пользователей
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    const blocked = searchParams.get('blocked')
    
    const where: any = {}
    if (role && role !== 'all') {
      where.role = role
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }
    if (blocked === 'true') {
      where.isBlocked = true
    } else if (blocked === 'false') {
      where.isBlocked = false
    }
    
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        isBlocked: true,
        blockedUntil: true,
        blockReason: true,
        blockedAt: true,
        createdAt: true,
        _count: {
          select: { orders: true }
        }
      }
    })
    
    const stats = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    })
    
    const blockedCount = await prisma.user.count({ where: { isBlocked: true } })
    
    return NextResponse.json({ users, stats, blockedCount })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Ошибка получения пользователей' }, { status: 500 })
  }
}

// PUT - обновить роль или статус блокировки
export async function PUT(request: NextRequest) {
  try {
    const admin = await getCurrentUser()
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { userId, role, isBlocked, blockedUntil, blockReason } = await request.json()
    
    const updateData: any = {}
    if (role !== undefined) updateData.role = role
    if (isBlocked !== undefined) {
      updateData.isBlocked = isBlocked
      if (isBlocked) {
        updateData.blockedAt = new Date()
        updateData.blockedBy = admin.id
        updateData.blockedUntil = blockedUntil || null
        updateData.blockReason = blockReason || null
      } else {
        updateData.blockedAt = null
        updateData.blockedBy = null
        updateData.blockedUntil = null
        updateData.blockReason = null
      }
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        isBlocked: true,
        blockedUntil: true,
        blockReason: true
      }
    })
    
    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Ошибка обновления' }, { status: 500 })
  }
}

// DELETE - удалить пользователя
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getCurrentUser()
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')
    
    if (!userId) {
      return NextResponse.json({ error: 'ID пользователя обязателен' }, { status: 400 })
    }
    
    if (userId === admin.id) {
      return NextResponse.json({ error: 'Нельзя удалить самого себя' }, { status: 400 })
    }
    
    // 👇 УДАЛЯЕМ ВСЕ СВЯЗАННЫЕ ЗАПИСИ ПО ПОРЯДКУ
    
    // 1. Удаляем записи об использовании скидок
    await prisma.discountUsage.deleteMany({
      where: { userId }
    })
    
    // 2. Удаляем записи о скидках пользователя
    await prisma.userDiscount.deleteMany({
      where: { userId }
    })
    
    // 3. Удаляем корзины пользователя
    await prisma.savedCart.deleteMany({
      where: { userId }
    })
    
    // 4. Удаляем избранное пользователя
    await prisma.favorite.deleteMany({
      where: { userId }
    })
    
    // 5. Удаляем комментарии пользователя
    await prisma.blogComment.deleteMany({
      where: { userId }
    })
    
    // 6. Удаляем отзывы пользователя
    await prisma.review.deleteMany({
      where: { userId }
    })
    
    // 7. Удаляем бронирования пользователя
    await prisma.booking.deleteMany({
      where: { userId }
    })
    
    // 8. Удаляем логи статусов заказов
    await prisma.orderStatusLog.deleteMany({
      where: { changedBy: userId }
    })
    
    // 9. Получаем заказы пользователя и удаляем их элементы
    const orders = await prisma.order.findMany({
      where: { userId },
      select: { id: true }
    })
    
    const orderIds = orders.map(o => o.id)
    
    if (orderIds.length > 0) {
      // Удаляем элементы заказов
      await prisma.orderItem.deleteMany({
        where: { orderId: { in: orderIds } }
      })
      
      // Удаляем логи статусов заказов
      await prisma.orderStatusLog.deleteMany({
        where: { orderId: { in: orderIds } }
      })
      
      // Удаляем сами заказы
      await prisma.order.deleteMany({
        where: { userId }
      })
    }
    
    // 10. Обновляем заказы, где пользователь был менеджером
    await prisma.order.updateMany({
      where: { assignedTo: userId },
      data: { assignedTo: null }
    })
    
    // 11. Теперь удаляем пользователя
    await prisma.user.delete({
      where: { id: userId }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Ошибка удаления пользователя' }, { status: 500 })
  }
}