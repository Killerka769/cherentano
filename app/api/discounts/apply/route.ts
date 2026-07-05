import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const { code, discountId, orderTotal, items } = await request.json()
    
    if (!code && !discountId) {
      return NextResponse.json({ error: 'Введите код скидки' }, { status: 400 })
    }
    
    const now = new Date()
    let discount = null
    let userDiscount = null
    
    // 1. Если передан discountId - ищем напрямую
    if (discountId) {
      discount = await prisma.discount.findUnique({
        where: { id: discountId }
      })
      
      // Проверяем, выдана ли эта скидка пользователю
      if (discount?.isIndividual) {
        userDiscount = await prisma.userDiscount.findFirst({
          where: {
            userId: user.id,
            discountId: discount.id,
            used: false,
            OR: [
              { expiresAt: { gte: now } },
              { expiresAt: null }
            ]
          }
        })
        
        if (!userDiscount) {
          return NextResponse.json({ error: 'Эта скидка не доступна вам' }, { status: 403 })
        }
      }
    }
    
    // 2. Если передан код - ищем по коду
    if (!discount && code) {
      // Ищем общую скидку
      discount = await prisma.discount.findFirst({
        where: {
          code: code.toUpperCase(),
          isActive: true,
          isIndividual: false,
          AND: [
            {
              OR: [
                { usageLimit: null },
                { usageLimit: { gt: prisma.discount.fields.usedCount } }
              ]
            },
            {
              OR: [
                { startDate: { lte: now } },
                { startDate: null }
              ]
            },
            {
              OR: [
                { endDate: { gte: now } },
                { endDate: null }
              ]
            }
          ]
        }
      })
      
      // Если не найдена общая - ищем индивидуальную
      if (!discount) {
        const userDisc = await prisma.userDiscount.findFirst({
          where: {
            userId: user.id,
            used: false,
            OR: [
              { expiresAt: { gte: now } },
              { expiresAt: null }
            ],
            discount: {
              code: code.toUpperCase(),
              isActive: true
            }
          },
          include: {
            discount: true
          }
        })
        
        if (userDisc && userDisc.discount) {
          discount = userDisc.discount
          userDiscount = userDisc
        }
      }
    }
    
    if (!discount) {
      return NextResponse.json({ error: 'Неверный или неактивный код' }, { status: 404 })
    }
    
    // 3. ПРОВЕРКА: использовал ли пользователь уже эту скидку
    // Проверяем, есть ли уже использованная скидка у пользователя
    const existingUsage = await prisma.discountUsage.findFirst({
      where: {
        discountId: discount.id,
        userId: user.id
      }
    })
    
    // Если скидка уже была использована - запрещаем
    if (existingUsage) {
      return NextResponse.json({ 
        error: 'Вы уже использовали эту скидку' 
      }, { status: 400 })
    }
    
    // 4. Проверка на первый заказ
    if (discount.isFirstOrder) {
      const ordersCount = await prisma.order.count({
        where: { userId: user.id }
      })
      if (ordersCount > 0) {
        return NextResponse.json({ error: 'Скидка только для первого заказа' }, { status: 400 })
      }
    }
    
    // 5. Проверка на день рождения
    if (discount.isBirthday) {
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: { birthDate: true }
      })
      const nowDate = new Date()
      const isBirthday = userData?.birthDate 
        ? new Date(userData.birthDate).getMonth() === nowDate.getMonth() && 
          new Date(userData.birthDate).getDate() === nowDate.getDate()
        : false
      if (!isBirthday) {
        return NextResponse.json({ error: 'Скидка доступна только в день рождения' }, { status: 400 })
      }
    }
    
    // 6. Проверка минимальной суммы
    if (discount.minOrderAmount && orderTotal < discount.minOrderAmount) {
      return NextResponse.json({ 
        error: `Минимальная сумма заказа для скидки: ${discount.minOrderAmount} ₽`,
        minAmount: discount.minOrderAmount 
      }, { status: 400 })
    }
    
    // 7. Расчет скидки
    let discountAmount = 0
    if (discount.type === 'PERCENT') {
      discountAmount = (orderTotal * discount.value) / 100
    } else {
      discountAmount = discount.value
    }
    
    if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
      discountAmount = discount.maxDiscount
    }
    
    discountAmount = Math.round(discountAmount * 100) / 100
    
    return NextResponse.json({
      discount,
      discountAmount,
      newTotal: orderTotal - discountAmount
    })
  } catch (error) {
    console.error('Error applying discount:', error)
    return NextResponse.json({ error: 'Ошибка применения скидки' }, { status: 500 })
  }
}