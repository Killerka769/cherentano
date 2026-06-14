import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, phone, password, name } = await request.json()
    
    // Валидация
    if (!email || !phone || !password) {
      return NextResponse.json(
        { error: 'Заполните все обязательные поля' },
        { status: 400 }
      )
    }
    
    // Проверка существующего пользователя
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
    
    // Хэширование пароля и создание пользователя
    const passwordHash = await hashPassword(password)
    
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        name: name || '',
        passwordHash,
        role: 'USER'
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true
      }
    })
    
    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Ошибка при регистрации' },
      { status: 500 }
    )
  }
}