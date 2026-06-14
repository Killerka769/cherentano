import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - получить настройки
export async function GET() {
  try {
    let settings = await prisma.settings.findFirst()
    
    if (!settings) {
      // Создаем настройки по умолчанию
      settings = await prisma.settings.create({
        data: {}
      })
    }
    
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Ошибка получения настроек' }, { status: 500 })
  }
}

// PUT - обновить настройки (только для админа)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const body = await request.json()
    
    let settings = await prisma.settings.findFirst()
    
    if (!settings) {
      settings = await prisma.settings.create({
        data: body
      })
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: body
      })
    }
    
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Ошибка обновления настроек' }, { status: 500 })
  }
}