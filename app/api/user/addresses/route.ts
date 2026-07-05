import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - получить историю адресов
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const addresses = await prisma.addressHistory.findMany({
      where: { userId: user.id },
      orderBy: { usedAt: 'desc' },
      take: 5
    })
    
    return NextResponse.json({ addresses })
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json({ error: 'Ошибка получения адресов' }, { status: 500 })
  }
}

// POST - сохранить новый адрес
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const { address, orderId } = await request.json()
    
    const saved = await prisma.addressHistory.create({
      data: {
        userId: user.id,
        address,
        orderId: orderId || null
      }
    })
    
    return NextResponse.json({ address: saved })
  } catch (error) {
    console.error('Error saving address:', error)
    return NextResponse.json({ error: 'Ошибка сохранения адреса' }, { status: 500 })
  }
}

// DELETE - удалить адрес
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID адреса обязателен' }, { status: 400 })
    }
    
    await prisma.addressHistory.delete({
      where: { id: id } // id уже строка, не может быть null
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting address:', error)
    return NextResponse.json({ error: 'Ошибка удаления адреса' }, { status: 500 })
  }
}