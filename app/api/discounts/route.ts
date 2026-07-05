import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const now = new Date()
    
    if (!user) {
      return NextResponse.json({ discounts: [] })
    }
    
    // Получаем ID скидок, которые пользователь уже использовал
    const usedDiscountIds = await prisma.discountUsage.findMany({
      where: { userId: user.id },
      select: { discountId: true }
    })
    const usedIds = new Set(usedDiscountIds.map(u => u.discountId))
    
    // 1. Получаем ОБЩИЕ скидки (только созданные админом)
    const commonDiscounts = await prisma.discount.findMany({
      where: {
        isActive: true,
        isIndividual: false,
        code: { not: 'FIRST10' },
        id: { notIn: Array.from(usedIds) },
        AND: [
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
    
    // 2. Получаем ИНДИВИДУАЛЬНЫЕ скидки пользователя
    const userDiscounts = await prisma.userDiscount.findMany({
      where: {
        userId: user.id,
        used: false,
        OR: [
          { expiresAt: { gte: now } },
          { expiresAt: null }
        ]
      },
      include: {
        discount: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Формируем ответ
    const discounts = [
      ...commonDiscounts.map(d => ({
        ...d,
        discountType: 'common' as const,
        isIndividual: false,
        userDiscountId: null,
        uniqueId: `common-${d.id}`
      })),
      ...userDiscounts
        .filter(ud => ud.discount && ud.discount.isActive)
        .map(ud => ({
          ...ud.discount,
          discountType: 'individual' as const,
          isIndividual: true,
          userDiscountId: ud.id,
          expiresAt: ud.expiresAt,
          uniqueId: `individual-${ud.id}`
        }))
    ]
    
    return NextResponse.json({ discounts })
  } catch (error) {
    console.error('Error fetching discounts:', error)
    return NextResponse.json({ error: 'Ошибка получения скидок' }, { status: 500 })
  }
}

// POST - создать скидку или подарить
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const body = await request.json()
    
    if (body.userId && body.discountId) {
      return await giveDiscount(body, user)
    }
    
    return await createDiscount(body)
  } catch (error) {
    console.error('Error in POST:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

async function createDiscount(body: any) {
  try {
    const existing = await prisma.discount.findUnique({
      where: { code: body.code.toUpperCase() }
    })
    
    if (existing) {
      return NextResponse.json({ 
        error: `Скидка с кодом ${body.code.toUpperCase()} уже существует` 
      }, { status: 400 })
    }
    
    const discount = await prisma.discount.create({
      data: {
        code: body.code.toUpperCase(),
        name: body.name,
        description: body.description,
        type: body.type,
        value: parseFloat(body.value),
        minOrderAmount: body.minOrderAmount ? parseFloat(body.minOrderAmount) : null,
        maxDiscount: body.maxDiscount ? parseFloat(body.maxDiscount) : null,
        usageLimit: body.usageLimit ? parseInt(body.usageLimit) : null,
        isFirstOrder: body.isFirstOrder || false,
        isBirthday: body.isBirthday || false,
        isIndividual: body.isIndividual || false,
        isActive: body.isActive !== undefined ? body.isActive : true,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        appliesTo: body.appliesTo || 'ALL'
      }
    })
    
    return NextResponse.json({ discount }, { status: 201 })
  } catch (error) {
    console.error('Error creating discount:', error)
    return NextResponse.json({ error: 'Ошибка создания скидки' }, { status: 500 })
  }
}

async function giveDiscount(body: any, admin: any) {
  try {
    const { userId, discountId, expiresDays } = body
    
    const discount = await prisma.discount.findUnique({
      where: { id: discountId }
    })
    
    if (!discount) {
      return NextResponse.json({ error: 'Скидка не найдена' }, { status: 404 })
    }
    
    let targetDiscountId = discountId
    let targetDiscount = discount
    
    if (!discount.isIndividual) {
      const uniqueCode = `${discount.code}_${userId.slice(0, 8)}`
      
      const existingIndividual = await prisma.discount.findFirst({
        where: {
          code: uniqueCode,
          isIndividual: true
        }
      })
      
      if (existingIndividual) {
        targetDiscountId = existingIndividual.id
        targetDiscount = existingIndividual
      } else {
        const newDiscount = await prisma.discount.create({
          data: {
            code: uniqueCode,
            name: `${discount.name} (подарена)`,
            description: discount.description,
            type: discount.type,
            value: discount.value,
            minOrderAmount: discount.minOrderAmount,
            maxDiscount: discount.maxDiscount,
            usageLimit: 1,
            isActive: true,
            isIndividual: true,
            appliesTo: discount.appliesTo,
            startDate: new Date(),
            endDate: expiresDays ? new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000) : null
          }
        })
        targetDiscountId = newDiscount.id
        targetDiscount = newDiscount
      }
    }
    
    const existing = await prisma.userDiscount.findUnique({
      where: {
        userId_discountId: {
          userId,
          discountId: targetDiscountId
        }
      }
    })
    
    if (existing) {
      return NextResponse.json({ 
        error: 'Эта скидка уже выдана пользователю' 
      }, { status: 400 })
    }
    
    const expiresAt = expiresDays 
      ? new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000)
      : null
    
    const userDiscount = await prisma.userDiscount.create({
      data: {
        userId,
        discountId: targetDiscountId,
        expiresAt,
        used: false
      },
      include: {
        discount: true,
        user: {
          select: { name: true, email: true }
        }
      }
    })
    
    return NextResponse.json({ userDiscount })
  } catch (error) {
    console.error('Error giving discount:', error)
    return NextResponse.json({ error: 'Ошибка выдачи скидки' }, { status: 500 })
  }
}

// PUT - обновить скидку
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const body = await request.json()
    
    if (body.code) {
      const existing = await prisma.discount.findFirst({
        where: {
          code: body.code.toUpperCase(),
          id: { not: body.id }
        }
      })
      
      if (existing) {
        return NextResponse.json({ 
          error: `Скидка с кодом ${body.code.toUpperCase()} уже существует` 
        }, { status: 400 })
      }
    }
    
    const discount = await prisma.discount.update({
      where: { id: body.id },
      data: {
        code: body.code.toUpperCase(),
        name: body.name,
        description: body.description,
        type: body.type,
        value: parseFloat(body.value),
        minOrderAmount: body.minOrderAmount ? parseFloat(body.minOrderAmount) : null,
        maxDiscount: body.maxDiscount ? parseFloat(body.maxDiscount) : null,
        usageLimit: body.usageLimit ? parseInt(body.usageLimit) : null,
        isFirstOrder: body.isFirstOrder || false,
        isBirthday: body.isBirthday || false,
        isIndividual: body.isIndividual || false,
        isActive: body.isActive,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        appliesTo: body.appliesTo || 'ALL'
      }
    })
    
    return NextResponse.json({ discount })
  } catch (error) {
    console.error('Error updating discount:', error)
    return NextResponse.json({ error: 'Ошибка обновления скидки' }, { status: 500 })
  }
}

// DELETE - удалить скидку
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id')!)
    
    if (!id) {
      return NextResponse.json({ error: 'ID скидки обязателен' }, { status: 400 })
    }
    
    await prisma.discountUsage.deleteMany({
      where: { discountId: id }
    })
    
    await prisma.userDiscount.deleteMany({
      where: { discountId: id }
    })
    
    await prisma.discount.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting discount:', error)
    return NextResponse.json({ error: 'Ошибка удаления скидки' }, { status: 500 })
  }
}