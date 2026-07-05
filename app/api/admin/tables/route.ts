import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - получить все столики
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const tables = await prisma.table.findMany({
      orderBy: { number: 'asc' }
    })
    
    return NextResponse.json({ tables })
  } catch (error) {
    console.error('Error fetching tables:', error)
    return NextResponse.json({ error: 'Ошибка получения столиков' }, { status: 500 })
  }
}

// POST - создать столик
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { number, seats, isActive, name, description, purpose, imageUrl, images } = await request.json()
    
    const table = await prisma.table.create({
      data: {
        number,
        seats,
        isActive: isActive ?? true,
        name: name || null,
        description: description || null,
        purpose: purpose || null,
        imageUrl: imageUrl || null,
        images: images || []
      }
    })
    
    return NextResponse.json({ table }, { status: 201 })
  } catch (error) {
    console.error('Error creating table:', error)
    return NextResponse.json({ error: 'Ошибка создания столика' }, { status: 500 })
  }
}

// PUT - обновить столик
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { id, number, seats, isActive, name, description, purpose, imageUrl, images } = await request.json()
    
    const table = await prisma.table.update({
      where: { id: parseInt(id) },
      data: {
        number,
        seats,
        isActive,
        name: name || null,
        description: description || null,
        purpose: purpose || null,
        imageUrl: imageUrl || null,
        images: images || []
      }
    })
    
    return NextResponse.json({ table })
  } catch (error) {
    console.error('Error updating table:', error)
    return NextResponse.json({ error: 'Ошибка обновления столика' }, { status: 500 })
  }
}

// DELETE - удалить столик
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    await prisma.table.delete({ where: { id: parseInt(id!) } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting table:', error)
    return NextResponse.json({ error: 'Ошибка удаления столика' }, { status: 500 })
  }
}