import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - получить все скидки (админ)
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const discounts = await prisma.discount.findMany({
      include: {
        _count: {
          select: { usages: true }
        },
        userDiscounts: {
          where: { used: false },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
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
    
    // Если есть userId и discountId - это дарение
    if (body.userId && body.discountId) {
      return await giveDiscount(body, user)
    }
    
    // Иначе создание скидки
    return await createDiscount(body)
  } catch (error) {
    console.error('Error in POST:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

async function createDiscount(body: any) {
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
}

async function giveDiscount(body: any, admin: any) {
  try {
    const { userId, discountId, expiresDays } = body
    
    // Проверяем существование скидки
    const discount = await prisma.discount.findUnique({
      where: { id: discountId }
    })
    
    if (!discount) {
      return NextResponse.json({ error: 'Скидка не найдена' }, { status: 404 })
    }
    
    // Если скидка НЕ индивидуальная, используем её как есть
    // И создаём только связь UserDiscount
    if (!discount.isIndividual) {
      // Проверяем, не выдана ли уже эта скидка пользователю
      const existing = await prisma.userDiscount.findUnique({
        where: {
          userId_discountId: {
            userId,
            discountId: discount.id
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
          discountId: discount.id,
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
    }
    
    // Если скидка уже индивидуальная, проверяем существование
    const existing = await prisma.userDiscount.findUnique({
      where: {
        userId_discountId: {
          userId,
          discountId: discount.id
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
        discountId: discount.id,
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
    
    // Удаляем связанные записи
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