'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, ChefHat, Flame, Clock } from 'lucide-react';
import styles from './PopularDishes.module.scss';
import ImageWithFallback from '../ImageWithFallback/ImageWithFallback';

interface Dish {
  id: number;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
  weight: number | null;
  category: {
    name: string;
    slug: string;
  } | null;
  description: string | null;
}

export default function PopularDishes() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPopularDishes();
  }, []);

  const fetchPopularDishes = async () => {
    try {
      const res = await fetch('/api/dishes?limit=6&menuType=both');
      const data = await res.json();
      // Просто берём первые 6 блюд, можно добавить логику "популярные"
      setDishes(data.dishes || []);
    } catch (error) {
      console.error('Failed to fetch popular dishes:', error);
      setError('Не удалось загрузить блюда');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className={styles.popular}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <TrendingUp size={14} />
              Рекомендуем
            </div>
            <h2 className={styles.title}>Популярные блюда</h2>
            <p className={styles.subtitle}>То, что выбирают наши гости чаще всего</p>
          </div>
          <div className={styles.grid}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`${styles.card} ${styles.skeleton}`}>
                <div className={styles.skeletonImage}></div>
                <div className={styles.info}>
                  <div className={styles.skeletonText}></div>
                  <div className={styles.skeletonText} style={{ width: '60%' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || dishes.length === 0) {
    return null; // Скрываем блок, если нет блюд
  }

  return (
    <section className={styles.popular}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionBadge}>
            <TrendingUp size={14} />
            Рекомендуем
          </div>
          <h2 className={styles.title}>Популярные блюда</h2>
          <p className={styles.subtitle}>То, что выбирают наши гости чаще всего</p>
        </div>

        <div className={styles.grid}>
          {dishes.slice(0, 6).map((dish, index) => (
            <Link 
              href={`/menu/${dish.slug}`} 
              key={dish.id} 
              className={styles.cardLink}
            >
              <div className={styles.card}>
                {index === 0 && (
                  <div className={styles.cardBadge}>
                    <Flame size={12} /> Хит
                  </div>
                )}
                {index === 1 && (
                  <div className={`${styles.cardBadge} ${styles.badgePopular}`}>
                    <TrendingUp size={12} /> Популярное
                  </div>
                )}
                <div className={styles.image}>
                  <ImageWithFallback
                    src={dish.imageUrl || ''}
                    alt={dish.name}
                    fallback="dish"
                  />
                </div>
                <div className={styles.info}>
                  <div className={styles.dishCategory}>
                    <ChefHat size={14} />
                    {dish.category?.name || 'Блюдо'}
                  </div>
                  <h3 className={styles.dishName}>{dish.name}</h3>
                  {dish.description && (
                    <p className={styles.dishDescription}>
                      {dish.description.length > 60 
                        ? `${dish.description.slice(0, 60)}...` 
                        : dish.description}
                    </p>
                  )}
                  <div className={styles.bottomRow}>
                    <div className={styles.price}>{dish.price} ₽</div>
                    <div className={styles.orderInfo}>
                      <span>{dish.weight ? `${dish.weight}г` : 'Вес не указан'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        <div className={styles.viewAll}>
          <Link href="/menu" className={styles.viewAllLink}>
            Смотреть всё меню
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}