import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - проверить статус верификации
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { phoneVerified: true }
    })
    
    return NextResponse.json({ verified: dbUser?.phoneVerified || false })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

// POST - запрос кода подтверждения
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const { action } = await request.json()
    
    if (action === 'request') {
      // Генерируем 6-значный код
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      
      // Сохраняем код в сессию или БД (временно)
      // В реальном проекте - отправка SMS через API
      console.log(`📱 Код подтверждения для ${user.phone}: ${code}`)
      
      // Временное решение - сохраняем в куку с кодом
      const response = NextResponse.json({ success: true, message: 'Код отправлен' })
      response.cookies.set('verification_code', code, {
        httpOnly: true,
        maxAge: 10 * 60 // 10 минут
      })
      
      return response
    }
    
    if (action === 'verify') {
      const { code } = await request.json()
      const savedCode = request.cookies.get('verification_code')?.value
      
      if (savedCode !== code) {
        return NextResponse.json({ error: 'Неверный код подтверждения' }, { status: 400 })
      }
      
      // Подтверждаем телефон
      await prisma.user.update({
        where: { id: user.id },
        data: {
          phoneVerified: true,
          phoneVerifiedAt: new Date()
        }
      })
      
      const response = NextResponse.json({ success: true, verified: true })
      response.cookies.delete('verification_code')
      
      return response
    }
    
    return NextResponse.json({ error: 'Неверное действие' }, { status: 400 })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json({ error: 'Ошибка верификации' }, { status: 500 })
  }
}