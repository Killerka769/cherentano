import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { id } = await params
    
    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: { category: true }
    })
    
    if (!post) {
      return NextResponse.json({ error: 'Пост не найден' }, { status: 404 })
    }
    
    return NextResponse.json({ post })
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json({ error: 'Ошибка получения поста' }, { status: 500 })
  }
}