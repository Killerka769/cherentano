import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth'

// Ограничение: обновление профиля не чаще 1 раза в неделю
const PROFILE_UPDATE_COOLDOWN_DAYS = 7
const PASSWORD_UPDATE_COOLDOWN_DAYS = 1 // Пароль можно менять раз в день

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const { name, email, phone } = await request.json()
    
    // Получаем последнее обновление профиля
    const lastUpdate = await prisma.user.findUnique({
      where: { id: user.id },
      select: { updatedAt: true }
    })
    
    // Проверка: можно ли обновлять профиль (не чаще раза в неделю)
    if (lastUpdate) {
      const daysSinceLastUpdate = (Date.now() - new Date(lastUpdate.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceLastUpdate < PROFILE_UPDATE_COOLDOWN_DAYS) {
        const remainingDays = Math.ceil(PROFILE_UPDATE_COOLDOWN_DAYS - daysSinceLastUpdate)
        return NextResponse.json(
          { 
            error: `Профиль можно обновлять не чаще 1 раза в неделю. Следующее обновление доступно через ${remainingDays} дн.`,
            cooldown: true,
            remainingDays
          },
          { status: 429 }
        )
      }
    }
    
    // Проверка: если телефон верифицирован, его нельзя менять
    if (user.phoneVerified && phone !== user.phone) {
      return NextResponse.json(
        { error: 'Верифицированный номер телефона нельзя изменить. Обратитесь к администратору.' },
        { status: 400 }
      )
    }
    
    // Проверка уникальности email
    if (email !== user.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      })
      if (existingEmail && existingEmail.id !== user.id) {
        return NextResponse.json(
          { error: 'Email уже используется другим пользователем' },
          { status: 400 }
        )
      }
    }
    
    // Проверка уникальности телефона
    if (phone !== user.phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone }
      })
      if (existingPhone && existingPhone.id !== user.id) {
        return NextResponse.json(
          { error: 'Телефон уже используется другим пользователем' },
          { status: 400 }
        )
      }
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name, email, phone, updatedAt: new Date() },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    return NextResponse.json({ 
      user: updatedUser,
      message: 'Профиль успешно обновлен. Следующее обновление доступно через 7 дней.'
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Ошибка обновления профиля' },
      { status: 500 }
    )
  }
}

// Смена пароля
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const { currentPassword, newPassword } = await request.json()
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Заполните все поля' },
        { status: 400 }
      )
    }
    
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Новый пароль должен содержать минимум 6 символов' },
        { status: 400 }
      )
    }
    
    // Получаем пользователя с данными о последней смене пароля
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true, updatedAt: true }
    })
    
    // Проверка: пароль можно менять не чаще 1 раза в день
    const lastPasswordChange = dbUser?.updatedAt
    if (lastPasswordChange) {
      const daysSinceLastChange = (Date.now() - new Date(lastPasswordChange).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceLastChange < PASSWORD_UPDATE_COOLDOWN_DAYS) {
        const remainingHours = Math.ceil((PASSWORD_UPDATE_COOLDOWN_DAYS - daysSinceLastChange) * 24)
        return NextResponse.json(
          { 
            error: `Пароль можно менять не чаще 1 раза в день. Следующая смена доступна через ${remainingHours} ч.`,
            cooldown: true,
            remainingHours
          },
          { status: 429 }
        )
      }
    }
    
    // Проверяем текущий пароль
    const isPasswordValid = await verifyPassword(currentPassword, dbUser!.passwordHash)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Неверный текущий пароль' },
        { status: 400 }
      )
    }
    
    // Хэшируем новый пароль
    const newPasswordHash = await hashPassword(newPassword)
    
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Пароль успешно изменен. Следующая смена пароля доступна через 24 часа.'
    })
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      { error: 'Ошибка смены пароля' },
      { status: 500 }
    )
  }
}