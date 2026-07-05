import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - получить настройки
export async function GET() {
  try {
    let settings = await prisma.settings.findFirst()
    
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          workDays: {
            monday: { open: "11:00", close: "23:00" },
            tuesday: { open: "11:00", close: "23:00" },
            wednesday: { open: "11:00", close: "23:00" },
            thursday: { open: "11:00", close: "23:00" },
            friday: { open: "11:00", close: "01:00" },
            saturday: { open: "11:00", close: "01:00" },
            sunday: { open: "11:00", close: "23:00" }
          },
          specialDays: [],
          isSpecialDay: false,
          specialMessage: null,
          phone: "+7 (988) 293-89-07",
          email: "info@cherentano.ru",
          address: "Республика Дагестан, Махачкала, улица Агасиева, 5А"
        }
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