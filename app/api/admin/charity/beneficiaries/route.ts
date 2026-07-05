import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const beneficiaries = await prisma.beneficiary.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ beneficiaries })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка получения списка' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const body = await request.json()
    const { name, description, address, phone, needs, urgency, imageUrl } = body
    
    const beneficiary = await prisma.beneficiary.create({
      data: {
        name,
        description,
        address,
        phone: phone || null,
        needs,
        urgency: urgency || 'Нормальный',
        imageUrl: imageUrl || null,
        isActive: true,
        isCompleted: false
      }
    })
    
    return NextResponse.json({ beneficiary }, { status: 201 })
  } catch (error) {
    console.error('Error creating beneficiary:', error)
    return NextResponse.json({ error: 'Ошибка создания' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const body = await request.json()
    const { id, ...data } = body
    
    const beneficiary = await prisma.beneficiary.update({
      where: { id },
      data
    })
    
    return NextResponse.json({ beneficiary })
  } catch (error) {
    console.error('Error updating beneficiary:', error)
    return NextResponse.json({ error: 'Ошибка обновления' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    await prisma.beneficiary.delete({ where: { id: id! } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting beneficiary:', error)
    return NextResponse.json({ error: 'Ошибка удаления' }, { status: 500 })
  }
}