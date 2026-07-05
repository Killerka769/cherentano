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
    
    // Нормализуем телефон: удаляем все пробелы, скобки, дефисы
    let normalizedLogin = login.trim()
    
    // Если это телефон (содержит цифры и возможно +), нормализуем
    if (login.includes('+') || /^[\d\s\-\(\)\+]+$/.test(login)) {
      // Удаляем все нецифровые символы, кроме +
      normalizedLogin = login.replace(/[\s\-\(\)]/g, '')
      // Если начинается с 8, заменяем на +7
      if (normalizedLogin.startsWith('8')) {
        normalizedLogin = '+7' + normalizedLogin.slice(1)
      }
      // Если не начинается с +, добавляем +7
      if (!normalizedLogin.startsWith('+') && normalizedLogin.length === 11) {
        normalizedLogin = '+7' + normalizedLogin.slice(1)
      }
    }
    
    console.log('Normalized login:', normalizedLogin)
    
    // Ищем пользователя по email ИЛИ по нормализованному телефону
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedLogin },
          { phone: normalizedLogin }
        ]
      }
    })
    
    // Если не нашли и это телефон, пробуем поискать с другим форматом
    if (!user && normalizedLogin.startsWith('+')) {
      const altPhone = normalizedLogin.replace('+', '')
      const altUser = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: { contains: altPhone } },
            { phone: normalizedLogin }
          ]
        }
      })
      if (altUser) {
        console.log('User found with alt phone search:', altUser.phone)
        // Проверяем пароль и продолжаем
        const isValid = await verifyPassword(password, altUser.passwordHash)
        if (isValid) {
          // Проверка блокировки
          if (altUser.isBlocked) {
            let errorMessage = 'Ваш аккаунт заблокирован'
            if (altUser.blockedUntil) {
              const until = new Date(altUser.blockedUntil)
              errorMessage += ` до ${until.toLocaleDateString('ru-RU')}`
            }
            if (altUser.blockReason) {
              errorMessage += `. Причина: ${altUser.blockReason}`
            }
            return NextResponse.json(
              { error: errorMessage },
              { status: 403 }
            )
          }
          
          const token = await createToken(altUser.id, altUser.role)
          
          const response = NextResponse.json({
            user: {
              id: altUser.id,
              email: altUser.email,
              phone: altUser.phone,
              name: altUser.name,
              role: altUser.role,
              phoneVerified: altUser.phoneVerified
            }
          })
          
          response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7
          })
          
          return response
        }
      }
    }
    
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
      maxAge: 60 * 60 * 24 * 14
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