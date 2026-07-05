'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Star, ChefHat, Clock, Award, ChevronRight, ShoppingCart, Plus, Minus, Sparkles } from 'lucide-react';
import ImageWithFallback from '@/app/components/ui/ImageWithFallback/ImageWithFallback';
import { useCart } from '@/app/contexts/CartContext';
import toast from 'react-hot-toast';
import styles from './DishOfDay.module.scss';

interface DishOfDay {
  id: number;
  dishId: number;
  date: string;
  dish: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    weight: number | null;
    category: {
      name: string;
    };
  };
}

export default function DishOfDay() {
  const { addToCart } = useCart();
  const [dishesOfDay, setDishesOfDay] = useState<DishOfDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchDishesOfDay();
  }, []);

  const fetchDishesOfDay = async () => {
    try {
      const res = await fetch('/api/dishes/dish-of-day');
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setDishesOfDay(data.dishesOfDay || []);
      
      const initialQuantities: Record<number, number> = {};
      data.dishesOfDay?.forEach((item: DishOfDay) => {
        initialQuantities[item.dishId] = 1;
      });
      setQuantities(initialQuantities);
    } catch (error) {
      console.error('Failed to fetch dishes of day:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const incrementQuantity = (dishId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantities(prev => ({
      ...prev,
      [dishId]: (prev[dishId] || 1) + 1
    }));
  };

  const decrementQuantity = (dishId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantities(prev => ({
      ...prev,
      [dishId]: Math.max(1, (prev[dishId] || 1) - 1)
    }));
  };

  const handleAddToCart = (item: DishOfDay, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const quantity = quantities[item.dishId] || 1;
    
    addToCart({
      id: item.dish.id,
      name: item.dish.name,
      price: item.dish.price,
      imageUrl: item.dish.imageUrl || undefined,
    }, quantity);
    
    toast.success(`Добавлено: ${item.dish.name} x${quantity}`, {
      duration: 2000,
      icon: '🛒',
    });
    
    setQuantities(prev => ({
      ...prev,
      [item.dishId]: 1
    }));
  };

  if (isLoading) {
    return (
      <div className={styles.skeletonWrapper}>
        <div className={styles.skeletonCard}></div>
        <div className={styles.skeletonCard}></div>
      </div>
    );
  }

  if (dishesOfDay.length === 0) {
    return null;
  }

  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <section className={styles.dishOfDay}>
      <div className={styles.container}>
        {/* БОЛЬШОЙ ЗАГОЛОВОК НА ВСЮ ШИРИНУ */}
        <div className={styles.heroHeader}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <Sparkles size={18} />
              Сегодняшние хиты
            </div>
            <h2 className={styles.heroTitle}>
              <span className={styles.heroIcon}>⭐</span>
              Блюда дня
              <span className={styles.heroDate}>{today}</span>
            </h2>
            <p className={styles.heroSubtitle}>
              Особые блюда, которые мы рекомендуем попробовать сегодня
            </p>
          </div>
          <div className={styles.heroDecoration}>
            <div className={styles.decoCircle1}></div>
            <div className={styles.decoCircle2}></div>
            <div className={styles.decoCircle3}></div>
          </div>
        </div>

        <div className={styles.grid}>
          {dishesOfDay.map((item) => (
            <Link key={item.id} href={`/menu/${item.dish.slug}`} className={styles.card}>
              <div className={styles.imageWrapper}>
                <ImageWithFallback
                  src={item.dish.imageUrl || ''}
                  alt={item.dish.name}
                  className={styles.image}
                  fallback="dish"
                />
                <span className={styles.hotBadge}>🔥 Хит дня</span>
                {item.dish.weight && (
                  <span className={styles.weightBadge}>{item.dish.weight}г</span>
                )}
              </div>
              <div className={styles.content}>
                <div className={styles.category}>
                  <ChefHat size={14} />
                  {item.dish.category?.name || 'Особое блюдо'}
                </div>
                <h3 className={styles.title}>{item.dish.name}</h3>
                {item.dish.description && (
                  <p className={styles.description}>{item.dish.description}</p>
                )}
                
                <div className={styles.footer}>
                  <div className={styles.price}>{item.dish.price} ₽</div>
                  
                  <div className={styles.actions}>
                    <div className={styles.quantityControl}>
                      <button 
                        onClick={(e) => decrementQuantity(item.dishId, e)} 
                        className={styles.qtyBtn}
                      >
                        <Minus size={14} />
                      </button>
                      <span className={styles.qtyValue}>{quantities[item.dishId] || 1}</span>
                      <button 
                        onClick={(e) => incrementQuantity(item.dishId, e)} 
                        className={styles.qtyBtn}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    
                    <button 
                      onClick={(e) => handleAddToCart(item, e)} 
                      className={styles.cartBtn}
                    >
                      <ShoppingCart size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}