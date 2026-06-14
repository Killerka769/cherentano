import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    let settings = await prisma.settings.findFirst()
    
    if (!settings) {
      settings = await prisma.settings.create({ data: {} })
    }
    
    const workDays = settings.workDays as any
    const today = new Date()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const todayName = dayNames[today.getDay()]
    
    const todaySchedule = workDays[todayName] || { open: '11:00', close: '23:00' }
    
    // Проверяем, есть ли сегодня специальный день
    const specialDays = settings.specialDays as any[]
    const todaySpecial = specialDays.find(sd => sd.date === today.toISOString().split('T')[0])
    
    if (todaySpecial) {
      return NextResponse.json({
        isSpecialDay: true,
        specialMessage: todaySpecial.message || 'Особый режим работы',
        hours: todaySpecial.hours || `${todaySchedule.open} - ${todaySchedule.close}`,
        isOpen: todaySpecial.isOpen !== false
      })
    }
    
    return NextResponse.json({
      isSpecialDay: settings.isSpecialDay || false,
      specialMessage: settings.specialMessage,
      hours: `${todaySchedule.open} - ${todaySchedule.close}`,
      isOpen: true,
      schedule: todaySchedule
    })
  } catch (error) {
    console.error('Error fetching hours:', error)
    return NextResponse.json({
      isSpecialDay: false,
      hours: '11:00 - 23:00',
      isOpen: true
    })
  }
}