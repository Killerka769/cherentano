'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Trash2, ShoppingCart, ArrowLeft, XCircle } from 'lucide-react';
import { useCart } from '@/app/contexts/CartContext';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface Favorite {
  id: string;
  dishId: number;
  dish: {
    id: number;
    name: string;
    slug: string;
    price: number;
    imageUrl: string | null;
    weight: number | null;
    description: string | null;
    isAvailable: boolean;
  };
}

export default function FavoritesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { addToCart } = useCart();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const res = await fetch('/api/favorites');
      const data = await res.json();
      setFavorites(data.favorites || []);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromFavorites = async (dishId: number) => {
    try {
      await fetch(`/api/favorites?dishId=${dishId}`, { method: 'DELETE' });
      setFavorites(prev => prev.filter(f => f.dishId !== dishId));
      toast.success('Удалено из избранного');
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const addToCartHandler = (dish: Favorite['dish']) => {
    if (!dish.isAvailable) {
      toast.error('Блюдо временно недоступно');
      return;
    }
    
    addToCart({
      id: dish.id,
      name: dish.name,
      price: dish.price,
      imageUrl: dish.imageUrl || undefined,
    }, 1);
    toast.success(`Добавлено: ${dish.name}`);
  };

  if (loading || isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  const availableFavorites = favorites.filter(f => f.dish.isAvailable);
  const unavailableFavorites = favorites.filter(f => !f.dish.isAvailable);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/profile" className={styles.backLink}>
          <ArrowLeft size={20} />
          Назад в профиль
        </Link>
        <h1 className={styles.title}>
          <Heart size={28} />
          Избранное
        </h1>
        <p className={styles.subtitle}>Блюда, которые вам понравились</p>
      </div>

      {favorites.length === 0 ? (
        <div className={styles.empty}>
          <Heart size={64} />
          <h3>Список избранного пуст</h3>
          <p>Добавляйте блюда в избранное, чтобы не потерять их</p>
          <Link href="/menu" className={styles.orderBtn}>
            Перейти в меню
          </Link>
        </div>
      ) : (
        <>
          {/* Доступные блюда */}
          {availableFavorites.length > 0 && (
            <div className={styles.grid}>
              {availableFavorites.map(fav => (
                <div key={fav.id} className={styles.card}>
                  <Link href={`/menu/${fav.dish.slug}`} className={styles.cardLink}>
                    <div className={styles.imageWrapper}>
                      <img 
                        src={fav.dish.imageUrl || `/images/dishes/${fav.dish.id}.jpg`}
                        alt={fav.dish.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                        }}
                      />
                      {fav.dish.weight && (
                        <span className={styles.weight}>{fav.dish.weight}г</span>
                      )}
                    </div>
                    <div className={styles.info}>
                      <h3>{fav.dish.name}</h3>
                      <p>{fav.dish.description?.slice(0, 80)}...</p>
                      <div className={styles.price}>{fav.dish.price} ₽</div>
                    </div>
                  </Link>
                  <div className={styles.actions}>
                    <button onClick={() => addToCartHandler(fav.dish)} className={styles.cartBtn}>
                      <ShoppingCart size={18} />
                      В корзину
                    </button>
                    <button onClick={() => removeFromFavorites(fav.dishId)} className={styles.removeBtn}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Недоступные блюда */}
          {unavailableFavorites.length > 0 && (
            <div className={styles.unavailableSection}>
              <h3 className={styles.unavailableTitle}>
                <XCircle size={18} />
                Временно недоступны
              </h3>
              <div className={styles.grid}>
                {unavailableFavorites.map(fav => (
                  <div key={fav.id} className={`${styles.card} ${styles.unavailableCard}`}>
                    <div className={styles.imageWrapper}>
                      <img 
                        src={fav.dish.imageUrl || `/images/dishes/${fav.dish.id}.jpg`}
                        alt={fav.dish.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                        }}
                      />
                      <div className={styles.unavailableOverlay}>
                        <XCircle size={32} />
                        <span>Временно недоступно</span>
                      </div>
                    </div>
                    <div className={styles.info}>
                      <h3>{fav.dish.name}</h3>
                      <p>{fav.dish.description?.slice(0, 80)}...</p>
                      <div className={styles.priceUnavailable}>Недоступно</div>
                    </div>
                    <div className={styles.actions}>
                      <button 
                        onClick={() => removeFromFavorites(fav.dishId)} 
                        className={styles.removeBtn}
                      >
                        <Trash2 size={18} /> Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}