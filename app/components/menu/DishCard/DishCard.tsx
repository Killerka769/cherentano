'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ShoppingCart, Plus, Minus, Heart, Check } from 'lucide-react';
import { useCart } from '@/app/contexts/CartContext';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import styles from './DishCard.module.scss';
import ImageWithFallback from '../../ui/ImageWithFallback/ImageWithFallback';

interface Dish {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  weight: number | null;
  slug: string;
}

interface DishCardProps {
  dish: Dish;
}

export default function DishCard({ dish }: DishCardProps) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const cartBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (user) {
      checkFavorite();
    }
  }, [user, dish.id]);

  const checkFavorite = async () => {
    try {
      const res = await fetch('/api/favorites');
      const data = await res.json();
      const favorites = data.favorites || [];
      setIsFavorite(favorites.some((f: any) => f.dishId === dish.id));
    } catch (error) {
      console.error('Failed to check favorite:', error);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Войдите в аккаунт, чтобы добавлять в избранное');
      return;
    }
    
    setIsFavoriteLoading(true);
    
    try {
      if (isFavorite) {
        await fetch(`/api/favorites?dishId=${dish.id}`, { method: 'DELETE' });
        toast.success('Удалено из избранного');
        setIsFavorite(false);
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dishId: dish.id })
        });
        toast.success('Добавлено в избранное');
        setIsFavorite(true);
      }
    } catch (error) {
      toast.error('Ошибка');
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAdding(true);
    setShowCheck(true);
    
    addToCart({
      id: dish.id,
      name: dish.name,
      price: dish.price,
      imageUrl: dish.imageUrl || undefined,
    }, quantity);
    
    // Эффект вспышки на кнопке
    if (cartBtnRef.current) {
      cartBtnRef.current.style.transform = 'scale(1.2)';
      setTimeout(() => {
        if (cartBtnRef.current) cartBtnRef.current.style.transform = '';
      }, 200);
    }
    
    toast.success(`✨ ${dish.name} x${quantity} добавлено в корзину!`, {
      duration: 1500,
      icon: '🛒',
      style: {
        background: 'linear-gradient(135deg, #c4492c, #f4a261)',
        color: 'white',
        fontWeight: 'bold',
      },
    });
    
    setTimeout(() => {
      setIsAdding(false);
      setTimeout(() => setShowCheck(false), 300);
    }, 500);
    
    setQuantity(1);
  };

  const increment = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantity(prev => prev + 1);
  };

  const decrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };

  return (
    <Link href={`/menu/${dish.slug}`} className={styles.cardLink}>
      <div className={styles.card}>
        <div className={styles.imageWrapper}>
          <ImageWithFallback
            src={dish.imageUrl || ''}
            alt={dish.name}
            className={styles.image}
            fallback="dish"
          />
          {dish.weight && (
            <span className={styles.weight}>{dish.weight}г</span>
          )}
          
          <button 
            onClick={toggleFavorite}
            className={`${styles.favoriteBtn} ${isFavorite ? styles.active : ''}`}
            disabled={isFavoriteLoading}
            aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
          >
            <Heart size={18} fill={isFavorite ? '#fff' : 'none'} stroke="#fff" strokeWidth={1.5} />
          </button>
        </div>
        
        <div className={styles.content}>
          <h3 className={styles.title}>{dish.name}</h3>
          {dish.description && (
            <p className={styles.description}>{dish.description}</p>
          )}
          <div className={styles.footer}>
            <div className={styles.price}>{dish.price} ₽</div>
            
            <div className={styles.quantityControl}>
              <button onClick={decrement} className={styles.qtyBtn}>
                <Minus size={14} />
              </button>
              <span className={styles.qtyValue}>{quantity}</span>
              <button onClick={increment} className={styles.qtyBtn}>
                <Plus size={14} />
              </button>
            </div>
            
            <button 
              onClick={handleAddToCart} 
              className={`${styles.cartBtn} ${isAdding ? styles.adding : ''}`}
              ref={cartBtnRef}
            >
              {showCheck ? <Check size={18} /> : <ShoppingCart size={18} />}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}