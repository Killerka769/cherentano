import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, createToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { login, password } = await request.json()
    
    console.log('Login attempt:', { login, passwordProvided: !!password })
    
    if (!login || !password) {
      return NextResponse.json(
        { error: 'Заполните email/телефон и пароль' },
        { status: 400 }
      )
    }
    
    // Ищем пользователя по email ИЛИ по телефону
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: login },
          { phone: login }
        ]
      }
    })
    
    console.log('User found:', user ? { id: user.id, email: user.email, phone: user.phone } : 'No user')
    
    if (!user) {
      return NextResponse.json(
        { error: 'Неверный email/телефон или пароль' },
        { status: 401 }
      )
    }
    
    const isValid = await verifyPassword(password, user.passwordHash)
    
    console.log('Password valid:', isValid)
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Неверный email/телефон или пароль' },
        { status: 401 }
      )
    }

    // Проверка блокировки
    if (user.isBlocked) {
      let errorMessage = 'Ваш аккаунт заблокирован'
      if (user.blockedUntil) {
        const until = new Date(user.blockedUntil)
        errorMessage += ` до ${until.toLocaleDateString('ru-RU')}`
      }
      if (user.blockReason) {
        errorMessage += `. Причина: ${user.blockReason}`
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: 403 }
      )
    }
    
    const token = await createToken(user.id, user.role)
    
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        phoneVerified: user.phoneVerified
      }
    })
    
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    })
    
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Ошибка при входе' },
      { status: 500 }
    )
  }
}