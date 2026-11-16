import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)

  const post = await prisma.blogPost.findUnique({
    where: { slug: decodedSlug, isPublished: true },
    include: { category: true },
  })

  if (!post) {
    return {
      title: 'Статья не найдена',
      robots: { index: false },
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chelentano05.ru'
  const plainText = (post.excerpt || post.content || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const description =
    plainText.slice(0, 160) || `${post.title} — блог ресторана Челентано`

  return {
    title: post.title,
    description,
    keywords: `${post.title}, ${post.category?.name || ''}, блог ресторана, Челентано, Махачкала`,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: post.title,
      description,
      url: `${baseUrl}/blog/${post.slug}`,
      images: post.imageUrl ? [{ url: post.imageUrl }] : [{ url: '/images/og-image.jpg' }],
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
    },
    alternates: {
      canonical: `${baseUrl}/blog/${post.slug}`,
    },
  }
}

export default function BlogPostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
