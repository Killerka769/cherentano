import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - получить активные баннеры (публичные)
export async function GET() {
  try {
    const now = new Date()
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [
              { startDate: { lte: now } },
              { startDate: null }
            ]
          },
          {
            OR: [
              { endDate: { gte: now } },
              { endDate: null }
            ]
          }
        ]
      },
      orderBy: { sortOrder: 'asc' }
    })
    return NextResponse.json({ banners })
  } catch (error) {
    console.error('Error fetching banners:', error)
    return NextResponse.json({ error: 'Ошибка получения баннеров' }, { status: 500 })
  }
}

// POST - создать баннер (только админ)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const body = await request.json()
    const banner = await prisma.banner.create({ 
      data: {
        title: body.title,
        subtitle: body.subtitle || null,
        description: body.description || null,
        imageUrl: body.imageUrl,
        link: body.link || null,
        linkText: body.linkText || null,
        type: body.type || 'PROMOTION',
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder || 0,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null
      }
    })
    return NextResponse.json({ banner }, { status: 201 })
  } catch (error) {
    console.error('Error creating banner:', error)
    return NextResponse.json({ error: 'Ошибка создания баннера' }, { status: 500 })
  }
}

// PUT - обновить баннер (только админ)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const body = await request.json()
    const banner = await prisma.banner.update({
      where: { id: body.id },
      data: {
        title: body.title,
        subtitle: body.subtitle || null,
        description: body.description || null,
        imageUrl: body.imageUrl,
        link: body.link || null,
        linkText: body.linkText || null,
        type: body.type || 'PROMOTION',
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder || 0,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null
      }
    })
    return NextResponse.json({ banner })
  } catch (error) {
    console.error('Error updating banner:', error)
    return NextResponse.json({ error: 'Ошибка обновления баннера' }, { status: 500 })
  }
}

// DELETE - удалить баннер (только админ)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id')!)
    await prisma.banner.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting banner:', error)
    return NextResponse.json({ error: 'Ошибка удаления баннера' }, { status: 500 })
  }
}