'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Star, Eye, TrendingUp } from 'lucide-react';
import styles from './PopularDishes.module.scss';
import ImageWithFallback from '../ImageWithFallback/ImageWithFallback';

interface Dish {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  category: string;
  rating?: number;
  orders?: number;
}

const mockDishes: Dish[] = [
  { id: 1, name: 'Мясная пицца', price: 480, category: 'pizza', rating: 4.8, orders: 156 },
  { id: 2, name: 'Куриная пицца', price: 400, category: 'pizza', rating: 4.7, orders: 142 },
  { id: 3, name: 'Пепперони', price: 450, category: 'pizza', rating: 4.9, orders: 203 },
  { id: 4, name: 'Даргинское чуду с творогом', price: 370, category: 'chudu', rating: 4.9, orders: 189 },
  { id: 5, name: 'Форель на углях', price: 620, category: 'grill', rating: 4.8, orders: 98 },
  { id: 6, name: 'Курзе с мясом', price: 330, category: 'dumplings', rating: 4.7, orders: 167 },
];

export default function PopularDishes() {
  const [dishes, setDishes] = useState<Dish[]>([]);

  useEffect(() => {
    setDishes(mockDishes);
  }, []);

  const addToCart = (dish: Dish) => {
    console.log('Added to cart:', dish);
  };

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
          {dishes.map((dish, index) => (
            <div key={dish.id} className={styles.card}>
              <div className={styles.cardBadge}>#{index + 1} по популярности</div>
              <div className={styles.image}>
                <ImageWithFallback
                  src={dish.imageUrl || ''}
                  alt={dish.name}
                  className={styles.image}
                  fallback="dish"
                />
                <div className={styles.imageOverlay}>
                  <button className={styles.quickViewBtn}>
                    <Eye size={18} />
                    Быстрый просмотр
                  </button>
                </div>
              </div>
              <div className={styles.info}>
                <div className={styles.rating}>
                  <Star size={14} fill="#f4b942" color="#f4b942" />
                  <span>{dish.rating}</span>
                  <span className={styles.orders}>• {dish.orders} заказов</span>
                </div>
                <h3 className={styles.dishName}>{dish.name}</h3>
                <div className={styles.priceSection}>
                  <div className={styles.price}>{dish.price} ₽</div>
                  <button onClick={() => addToCart(dish)} className={styles.cartBtn}>
                    <ShoppingCart size={18} />
                    В корзину
                  </button>
                </div>
              </div>
            </div>
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