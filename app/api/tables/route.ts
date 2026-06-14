import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tables = await prisma.table.findMany({
      where: { isActive: true },
      orderBy: { number: 'asc' }
    })
    return NextResponse.json({ tables })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка получения столов' }, { status: 500 })
  }
}