import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const menuTypes = await prisma.dish.groupBy({
      by: ['menuType'],
      _count: true
    })
    
    return NextResponse.json({ menuTypes })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка получения типов меню' }, { status: 500 })
  }
}