import Script from 'next/script';
import Hero from '@/app/components/ui/Hero/Hero';
import Features from '@/app/components/ui/Features/Features';
import PopularDishes from '@/app/components/ui/PopularDishes/PopularDishes';
import Reviews from './components/ui/Reviews/Reviews';
import RecentlyViewed from './components/ui/RecentlyViewed/RecentlyViewed';
import Banner from './components/ui/Banner/Banner';
import RegistrationBanner from './components/ui/RegistrationBanner/RegistrationBanner';
import BlogPreview from './components/ui/BlogPreview/BlogPreview';

export default function Home() {
  // Структурированные данные для ресторана (JSON-LD)
  const restaurantSchema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": "Челентано",
    "description": "Ресторан дагестанской и европейской кухни в Махачкале. Уютная атмосфера, авторские блюда, доставка и бронирование столиков.",
    "image": "https://chelentano05.ru/images/og-image.jpg",
    "url": "https://chelentano05.ru",
    "telephone": "+7 (988) 293-89-07",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "ул. Агасиева, 5А",
      "addressLocality": "Махачкала",
      "addressRegion": "Республика Дагестан",
      "postalCode": "367000",
      "addressCountry": "RU"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "42.980263",
      "longitude": "47.478083"
    },
    "openingHours": [
      "Mo-Su 11:00-23:00",
      "Fr-Sa 11:00-01:00"
    ],
    "servesCuisine": ["Дагестанская кухня", "Европейская кухня"],
    "priceRange": "₽₽",
    "menu": "https://chelentano05.ru/menu",
    "acceptsReservations": "https://chelentano05.ru/booking",
    "sameAs": [
      "https://www.instagram.com/cherentano",
      "https://t.me/cherentano_bot"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.4",
      "reviewCount": "97"
    }
  };

  // Хлебные крошки (BreadcrumbList)
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Главная",
        "item": "https://chelentano05.ru"
      }
    ]
  };

  // Организация (Organization)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Челентано",
    "url": "https://chelentano05.ru",
    "logo": "https://chelentano05.ru/images/logo.png",
    "description": "Ресторан дагестанской и европейской кухни в Махачкале",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+7 (988) 293-89-07",
      "contactType": "customer service",
      "availableLanguage": ["Russian"]
    }
  };

  return (
    <>
      {/* JSON-LD структурированные данные */}
      <Script
        id="restaurant-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      {/* Основной контент */}
      <Hero />
      <Banner />
      <BlogPreview />
      <PopularDishes />
      <Features />
      <Reviews />
      <RecentlyViewed />
      <RegistrationBanner />
    </>
  );
}