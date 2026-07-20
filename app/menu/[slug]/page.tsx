import DishPageClient from './DishPageClient';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Script from 'next/script';

// ✅ ВКЛЮЧАЕМ ДИНАМИЧЕСКИЙ РЕЖИМ
export const dynamic = 'force-dynamic';
// ИЛИ
// export const dynamicParams = true;

async function getDish(slug: string) {
  // ✅ Декодируем slug на случай, если пришёл закодированный
  const decodedSlug = decodeURIComponent(slug);
  
  const dish = await prisma.dish.findUnique({
    where: { slug: decodedSlug, isAvailable: true },
    include: {
      category: true,
    },
  });
  
  if (!dish) return null;
  
  const similarDishes = await prisma.dish.findMany({
    where: {
      categoryId: dish.categoryId,
      id: { not: dish.id },
      isAvailable: true,
    },
    take: 4,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      imageUrl: true,
      weight: true,
    },
  });
  
  return { dish, similarDishes };
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DishPage({ params }: PageProps) {
  const { slug } = await params;
  
  console.log('🔍 Получен slug:', slug);
  console.log('🔍 Декодированный slug:', decodeURIComponent(slug));
  
  const data = await getDish(slug);
  
  if (!data) {
    console.log('❌ Блюдо не найдено');
    notFound();
  }
  
  console.log('✅ Блюдо найдено:', data.dish.name);
  
  const serializedData = {
    dish: {
      ...data.dish,
      createdAt: data.dish.createdAt.toISOString(),
    },
    similarDishes: data.similarDishes,
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": data.dish.name,
    "description": data.dish.description || `${data.dish.name} — блюдо дагестанской и европейской кухни`,
    "image": data.dish.imageUrl || "https://chelentano05.ru/images/og-image.jpg",
    "offers": {
      "@type": "Offer",
      "price": data.dish.price,
      "priceCurrency": "RUB",
      "availability": data.dish.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Челентано"
      }
    },
    "brand": {
      "@type": "Brand",
      "name": "Челентано"
    },
    "category": data.dish.category?.name || "Блюдо"
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Главная",
        "item": "https://chelentano05.ru"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Меню",
        "item": "https://chelentano05.ru/menu"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": data.dish.category?.name || "Категория",
        "item": `https://chelentano05.ru/menu?category=${data.dish.category?.slug || ''}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": data.dish.name,
        "item": `https://chelentano05.ru/menu/${data.dish.slug}`
      }
    ]
  };

  return (
    <>
      <Script
        id="product-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <DishPageClient initialData={serializedData} />
    </>
  );
}