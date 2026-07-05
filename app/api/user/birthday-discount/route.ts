import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    if (!user.birthDate) {
      return NextResponse.json({ 
        hasBirthday: false, 
        message: 'Дата рождения не указана'
      })
    }
    
    const now = new Date()
    const birthDate = new Date(user.birthDate)
    
    const isBirthday = birthDate.getMonth() === now.getMonth() && 
                       birthDate.getDate() === now.getDate()
    
    if (!isBirthday) {
      return NextResponse.json({ 
        hasBirthday: false, 
        message: 'Сегодня не день рождения'
      })
    }
    
    // Проверяем, есть ли уже скидка на ДР
    const existing = await prisma.userDiscount.findFirst({
      where: {
        userId: user.id,
        discount: {
          code: {
            startsWith: 'BIRTHDAY15_'
          }
        }
      },
      include: { discount: true }
    })
    
    if (existing) {
      return NextResponse.json({ 
        hasBirthday: true,
        alreadyUsed: true,
        message: 'Скидка на день рождения уже активирована'
      })
    }
    
    // Создаём скидку на ДР
    const individualDiscount = await prisma.discount.create({
      data: {
        code: `BIRTHDAY15_${user.id.slice(0, 8)}`,
        name: '15% на день рождения',
        description: 'Скидка 15% в день рождения',
        type: 'PERCENT',
        value: 15,
        isBirthday: true,
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
    
    return NextResponse.json({ 
      hasBirthday: true,
      discountGiven: true,
      message: '🎉 С днём рождения! Скидка 15% активирована!'
    })
  } catch (error) {
    console.error('Error checking birthday discount:', error)
    return NextResponse.json({ error: 'Ошибка проверки дня рождения' }, { status: 500 })
  }
}