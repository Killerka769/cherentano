import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { birthDate: true }
    })
    
    return NextResponse.json({ birthDate: fullUser?.birthDate || null })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка получения даты рождения' }, { status: 500 })
  }
}