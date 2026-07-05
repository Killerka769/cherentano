import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Получаем всех активных нуждающихся
    const beneficiaries = await prisma.beneficiary.findMany({
      where: {
        isActive: true,
        isCompleted: false,
      },
      include: {
        helpRequests: {
          where: {
            status: 'COMPLETED'
          },
          orderBy: { deliveredAt: 'desc' },
          take: 1
        }
      },
      orderBy: { urgency: 'desc' }
    })
    
    // Фильтруем: показываем только тех, у кого есть хотя бы один свободный приём пищи
    const availableBeneficiaries = beneficiaries.filter(b => {
      const todayHelps = b.helpRequests.filter(h => {
        const hDate = new Date(h.deliveredAt!)
        return hDate >= today
      })
      
      // Если есть хотя бы одна completed помощь сегодня - не показываем
      return todayHelps.length < 3 // максимум 3 приёма пищи
    })
    
    return NextResponse.json({ beneficiaries: availableBeneficiaries })
  } catch (error) {
    console.error('Error fetching beneficiaries:', error)
    return NextResponse.json({ error: 'Ошибка получения списка' }, { status: 500 })
  }
}