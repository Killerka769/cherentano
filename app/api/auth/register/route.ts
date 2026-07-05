import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, phone, password, name, birthDate } = await request.json()
    
    if (!email || !phone || !password) {
      return NextResponse.json(
        { error: 'Заполните все обязательные поля' },
        { status: 400 }
      )
    }
    
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone }
        ]
      }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email или телефоном уже существует' },
        { status: 400 }
      )
    }
    
    const passwordHash = await hashPassword(password)
    
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        name: name || '',
        passwordHash,
        role: 'USER',
        birthDate: birthDate ? new Date(birthDate) : null
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true,
        birthDate: true
      }
    })
    
    // ============ ВЫДАЁМ ИНДИВИДУАЛЬНУЮ СКИДКУ FIRST10 ============
    try {
      // Создаём индивидуальную скидку для пользователя
      const individualDiscount = await prisma.discount.create({
        data: {
          code: `FIRST10_${user.id.slice(0, 8)}`,
          name: '10% на первый заказ',
          description: 'Скидка 10% на первый заказ в ресторане',
          type: 'PERCENT',
          value: 10,
          isFirstOrder: true,
          isActive: true,
          isIndividual: true,
          usageLimit: 1,
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      })
      
      await prisma.userDiscount.create({
        data: {
          userId: user.id,
          discountId: individualDiscount.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          used: false
        }
      })
      
      console.log(`✅ Скидка FIRST10 выдана пользователю ${user.id}`)
    } catch (discountError) {
      console.error('Error creating first order discount:', discountError)
    }
    
    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Ошибка при регистрации' },
      { status: 500 }
    )
  }
}