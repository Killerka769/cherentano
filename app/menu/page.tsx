import Script from 'next/script';
import MenuClient from './MenuClient';

// Функция для получения данных на сервере
async function getDishes(menuType: string = 'pickup', category: string = 'all', search: string = '', page: number = 1) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const params = new URLSearchParams({
    menuType,
    category,
    search,
    page: String(page),
    limit: '9'
  });
  
  const res = await fetch(`${baseUrl}/api/dishes?${params}`, {
    cache: 'no-store',
  });
  
  if (!res.ok) return { dishes: [], total: 0, totalPages: 1 };
  return res.json();
}

async function getCategories() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/categories`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.categories || [];
}

export default async function MenuPage() {
  const [dishesData, categories] = await Promise.all([
    getDishes('pickup'),
    getCategories()
  ]);

  const menuSchema = {
    "@context": "https://schema.org",
    "@type": "Menu",
    "name": "Меню ресторана Челентано",
    "description": "Дагестанская и европейская кухня в Махачкале. Пицца, чуду, шашлык, паста, хинкал, стейки.",
    "hasMenuItem": dishesData.dishes.slice(0, 10).map((dish: any) => ({
      "@type": "MenuItem",
      "name": dish.name,
      "description": dish.description || undefined,
      "offers": {
        "@type": "Offer",
        "price": dish.price,
        "priceCurrency": "RUB"
      }
    }))
  };

  return (
    <>
      <Script
        id="menu-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(menuSchema) }}
      />
      <MenuClient
        initialDishes={dishesData.dishes || []}
        initialCategories={categories}
        initialTotalItems={dishesData.total || 0}
        initialTotalPages={dishesData.totalPages || 1}
        initialMenuType="pickup"
      />
    </>
  );
}