import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

// Генерируем мета-теги на основе блюда
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dish = await prisma.dish.findUnique({
    where: { slug, isAvailable: true },
    include: { category: true }
  });
  
  if (!dish) {
    return {
      title: 'Блюдо не найдено',
      robots: { index: false }
    }
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chelentano05.ru';
  
  return {
    title: `${dish.name} | Меню Челентано`,
    description: dish.description || `${dish.name} — блюдо дагестанской и европейской кухни в ресторане Челентано. ${dish.price} ₽.`,
    keywords: `${dish.name}, ${dish.category?.name || ''}, меню ресторана, Челентано, доставка еды, Махачкала`,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `${dish.name} — ${dish.price} ₽ | Челентано`,
      description: dish.description || `Попробуйте ${dish.name} в ресторане Челентано`,
      url: `${baseUrl}/menu/${dish.slug}`,
      images: dish.imageUrl ? [{ url: dish.imageUrl }] : [{ url: '/images/og-image.jpg' }],
      type: 'website',
    },
    alternates: {
      canonical: `${baseUrl}/menu/${dish.slug}`,
    },
  }
}

export default function DishLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}