import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    const recipe = await prisma.recipe.findUnique({
      where: { slug },
      include: {
        category: true,
        comments: {
          where: { 
            isApproved: true,
            parentId: null // только корневые комментарии
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true
              }
            },
            replies: {
              where: { isApproved: true },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    role: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    
    if (!recipe || !recipe.isPublished) {
      return NextResponse.json({ error: 'Рецепт не найден' }, { status: 404 })
    }
    
    // Увеличиваем счетчик просмотров
    await prisma.recipe.update({
      where: { id: recipe.id },
      data: { views: { increment: 1 } }
    })
    
    return NextResponse.json({ recipe })
  } catch (error) {
    console.error('Error fetching recipe:', error)
    return NextResponse.json({ error: 'Ошибка получения рецепта' }, { status: 500 })
  }
}