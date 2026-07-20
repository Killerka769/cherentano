import Script from 'next/script';
import WeeklyMenuClient from './WeeklyMenuClient';
import { prisma } from '@/lib/prisma';

// ✅ Тип для блюда в меню на неделю
interface WeeklyMenuDish {
  id: number;
  date: string;
  dishId: number;
  dish: {
    id: number;
    name: string;
    slug: string;
    price: number;
    imageUrl: string | null;
    weight: number | null;
    description: string | null;
    category: {
      name: string;
    } | null;
  };
}

// Получаем меню на неделю с сервера
async function getWeeklyMenu(startDate: string) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);

  const dishes = await prisma.dishOfDay.findMany({
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
    include: {
      dish: {
        include: {
          category: true,
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  // ✅ Группируем по дням, преобразуя Date в строку
  const grouped: Record<string, WeeklyMenuDish[]> = {};
  dishes.forEach(item => {
    const dateStr = item.date.toISOString().split('T')[0];
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push({
      id: item.id,
      date: dateStr,
      dishId: item.dishId,
      dish: {
        id: item.dish.id,
        name: item.dish.name,
        slug: item.dish.slug,
        price: item.dish.price,
        imageUrl: item.dish.imageUrl,
        weight: item.dish.weight,
        description: item.dish.description,
        category: item.dish.category ? {
          name: item.dish.category.name,
        } : null,
      },
    });
  });

  return grouped;
}

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function WeeklyMenuPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const today = new Date();
  const startDate = params.date || today.toISOString().split('T')[0];
  
  const weeklyMenu = await getWeeklyMenu(startDate);

  const weeklyMenuSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Меню на неделю в ресторане Челентано",
    "description": "Блюда дагестанской и европейской кухни по дням недели в Махачкале",
    "numberOfItems": Object.values(weeklyMenu).reduce((acc, day) => acc + day.length, 0),
    "itemListElement": Object.entries(weeklyMenu).flatMap(([date, dishes], index) => 
      dishes.map((dish, dishIndex) => ({
        "@type": "ListItem",
        "position": index * 10 + dishIndex + 1,
        "name": `${date}: ${dish.dish.name}`,
        "description": `${dish.dish.category?.name || ''} — ${dish.dish.price} ₽`,
        "url": `https://chelentano05.ru/menu/${dish.dish.slug}`
      }))
    )
  };

  return (
    <>
      <Script
        id="weekly-menu-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(weeklyMenuSchema) }}
      />
      <WeeklyMenuClient initialWeeklyMenu={weeklyMenu} initialDate={startDate} />
    </>
  );
}