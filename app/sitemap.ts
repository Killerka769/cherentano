import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cherentano.ru'
  const currentDate = new Date()
  
  // Статические страницы
  const staticPages = [
    { url: baseUrl, priority: 1.0, changeFrequency: 'daily' as const, lastModified: currentDate },
    { url: `${baseUrl}/menu`, priority: 0.9, changeFrequency: 'daily' as const, lastModified: currentDate },
    { url: `${baseUrl}/blog`, priority: 0.8, changeFrequency: 'daily' as const, lastModified: currentDate },
    { url: `${baseUrl}/reviews`, priority: 0.8, changeFrequency: 'weekly' as const, lastModified: currentDate },
    { url: `${baseUrl}/contacts`, priority: 0.7, changeFrequency: 'monthly' as const, lastModified: currentDate },
    { url: `${baseUrl}/about`, priority: 0.7, changeFrequency: 'monthly' as const, lastModified: currentDate },
    { url: `${baseUrl}/booking`, priority: 0.6, changeFrequency: 'weekly' as const, lastModified: currentDate },
  ]
  
  // Динамические страницы блога
  let blogPages: MetadataRoute.Sitemap = []
  try {
    const posts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true }
    })
    blogPages = posts.map(post => ({
      url: `${baseUrl}/blog/${post.slug}`,
      priority: 0.6,
      changeFrequency: 'weekly' as const,
      lastModified: post.updatedAt
    }))
  } catch (error) {
    console.error('Failed to fetch blog posts for sitemap:', error)
  }
  
  // Динамические страницы блюд (без updatedAt, используем createdAt)
  let dishPages: MetadataRoute.Sitemap = []
  try {
    const dishes = await prisma.dish.findMany({
      where: { isAvailable: true },
      select: { slug: true, createdAt: true }
    })
    dishPages = dishes.map(dish => ({
      url: `${baseUrl}/menu/${dish.slug}`,
      priority: 0.6,
      changeFrequency: 'weekly' as const,
      lastModified: dish.createdAt
    }))
  } catch (error) {
    console.error('Failed to fetch dishes for sitemap:', error)
  }
  
  // Динамические страницы категорий
  let categoryPages: MetadataRoute.Sitemap = []
  try {
    const categories = await prisma.category.findMany({
      select: { slug: true }
    })
    categoryPages = categories.map(cat => ({
      url: `${baseUrl}/menu?category=${cat.slug}`,
      priority: 0.7,
      changeFrequency: 'weekly' as const,
      lastModified: currentDate
    }))
  } catch (error) {
    console.error('Failed to fetch categories for sitemap:', error)
  }
  
  return [...staticPages, ...blogPages, ...dishPages, ...categoryPages]
}