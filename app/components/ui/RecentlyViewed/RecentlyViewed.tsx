'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import ImageWithFallback from '@/app/components/ui/ImageWithFallback/ImageWithFallback';
import styles from './RecentlyViewed.module.scss';

interface ViewedDish {
  id: number;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
  viewedAt: number;
}

export default function RecentlyViewed() {
  const [recentDishes, setRecentDishes] = useState<ViewedDish[]>([]);

  useEffect(() => {
    loadRecentDishes();
    
    // Слушаем событие добавления в корзину для обновления
    window.addEventListener('storage', loadRecentDishes);
    return () => window.removeEventListener('storage', loadRecentDishes);
  }, []);

  const loadRecentDishes = () => {
    try {
      const stored = localStorage.getItem('recentlyViewed');
      if (stored) {
        const dishes = JSON.parse(stored);
        // Показываем только последние 4
        setRecentDishes(dishes.slice(0, 4));
        console.log('Loaded recently viewed:', dishes);
      }
    } catch (e) {
      console.error('Failed to parse recently viewed:', e);
    }
  };

  if (recentDishes.length === 0) return null;

  return (
    <section className={styles.recentSection}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Clock size={20} />
          <h2>Вы недавно смотрели</h2>
        </div>
        <div className={styles.grid}>
          {recentDishes.map(dish => (
            <Link key={dish.id} href={`/menu/${dish.slug}`} className={styles.card}>
              <div className={styles.image}>
                <ImageWithFallback
                  src={dish.imageUrl || ''}
                  alt={dish.name}
                  className={styles.image}
                  fallback="dish"
                />
              </div>
              <div className={styles.info}>
                <h3>{dish.name}</h3>
                <div className={styles.price}>{dish.price} ₽</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}