'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShoppingCart, Plus, Minus, Heart, Share2, 
  Flame, Clock, Award, ArrowLeft,
  ChefHat, Truck, Utensils,
  Scale,
  Leaf
} from 'lucide-react';
import { useCart } from '@/app/contexts/CartContext';
import { useAuth } from '@/app/contexts/AuthContext';
import ImageWithFallback from '@/app/components/ui/ImageWithFallback/ImageWithFallback';
import toast from 'react-hot-toast';
import styles from './page.module.scss';
import RecentlyViewed from '@/app/components/ui/RecentlyViewed/RecentlyViewed';

interface Dish {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  weight: number | null;
  categoryId: number | null; // ✅ МОЖЕТ БЫТЬ NULL
  category: {
    id: number;
    name: string;
    slug: string;
  } | null; // ✅ МОЖЕТ БЫТЬ NULL
  isAvailable: boolean;
  createdAt: string;
}

interface SimilarDish {
  id: number;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
  weight: number | null;
}

interface DishPageClientProps {
  initialData: {
    dish: Dish;
    similarDishes: SimilarDish[];
  };
}

export default function DishPageClient({ initialData }: DishPageClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [dish] = useState<Dish>(initialData.dish);
  const [similarDishes] = useState<SimilarDish[]>(initialData.similarDishes);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  useEffect(() => {
    if (user && dish) {
      checkFavorite();
    }
  }, [user, dish]);

  useEffect(() => {
    if (dish) {
      saveToRecentlyViewed();
    }
  }, [dish]);

  const saveToRecentlyViewed = () => {
    if (!dish) return;
    
    try {
      const stored = localStorage.getItem('recentlyViewed');
      let recent: any[] = stored ? JSON.parse(stored) : [];
      recent = recent.filter((item: any) => item.id !== dish.id);
      recent.unshift({
        id: dish.id,
        name: dish.name,
        slug: dish.slug,
        price: dish.price,
        imageUrl: dish.imageUrl,
        viewedAt: Date.now()
      });
      recent = recent.slice(0, 10);
      localStorage.setItem('recentlyViewed', JSON.stringify(recent));
    } catch (e) {
      console.error('Failed to save recently viewed:', e);
    }
  };

  const checkFavorite = async () => {
    try {
      const res = await fetch('/api/favorites');
      const data = await res.json();
      const favorites = data.favorites || [];
      setIsFavorite(favorites.some((f: any) => f.dishId === dish?.id));
    } catch (error) {
      console.error('Failed to check favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Войдите в аккаунт, чтобы добавлять в избранное');
      return;
    }
    
    setIsFavoriteLoading(true);
    
    try {
      if (isFavorite) {
        await fetch(`/api/favorites?dishId=${dish?.id}`, { method: 'DELETE' });
        toast.success('Удалено из избранного');
        setIsFavorite(false);
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dishId: dish?.id })
        });
        toast.success('Добавлено в избранное ❤️');
        setIsFavorite(true);
      }
    } catch (error) {
      toast.error('Ошибка');
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!dish) return;
    
    setIsAdding(true);
    addToCart({
      id: dish.id,
      name: dish.name,
      price: dish.price,
      imageUrl: dish.imageUrl || undefined,
    }, quantity);
    
    toast.success(`Добавлено: ${dish.name} x${quantity}`, {
      duration: 2000,
      icon: '🛒',
    });
    
    setTimeout(() => setIsAdding(false), 500);
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: dish?.name,
        text: `Попробуйте ${dish?.name} в ресторане Челентано!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Ссылка скопирована!');
    }
  };

  return (
    <div className={styles.container}>
      {/* Хлебные крошки */}
      <div className={styles.breadcrumbs}>
        <Link href="/">Главная</Link>
        <span>/</span>
        <Link href="/menu">Меню</Link>
        <span>/</span>
        <Link href={`/menu?category=${dish.category?.slug || ''}`}>
          {dish.category?.name || 'Категория'}
        </Link>
        <span>/</span>
        <span className={styles.current}>{dish.name}</span>
      </div>

      <div className={styles.content}>
        {/* Левая колонка - фото */}
        <div className={styles.imageSection}>
          <div className={styles.imageWrapper}>
            <ImageWithFallback
              src={dish.imageUrl || ''}
              alt={dish.name}
              className={styles.image}
              fallback="dish"
            />
            {dish.weight && (
              <span className={styles.weightBadge}>{dish.weight}г</span>
            )}
            <button 
              onClick={handleShare}
              className={styles.shareBtn}
              title="Поделиться"
            >
              <Share2 size={18} />
            </button>
            <button 
              onClick={toggleFavorite}
              disabled={isFavoriteLoading}
              className={`${styles.likeBtn} ${isFavorite ? styles.liked : ''}`}
              title={isFavorite ? 'Удалить из избранного' : 'В избранное'}
            >
              <Heart size={18} fill={isFavorite ? '#e91e63' : 'none'} />
            </button>
          </div>
        </div>

        {/* Правая колонка - информация */}
        <div className={styles.infoSection}>
          <div className={styles.category}>
            <ChefHat size={14} />
            {dish.category?.name || 'Блюдо'}
          </div>
          
          <h1 className={styles.title}>{dish.name}</h1>

          {dish.description && (
            <div className={styles.description}>
              <h3>Описание</h3>
              <p>{dish.description}</p>
            </div>
          )}

        <div className={styles.features}>
        <div className={styles.feature}>
            <Leaf size={18} />
            <span>Только свежие продукты</span>
        </div>
        <div className={styles.feature}>
            <Scale size={18} />
            <span>Сбалансированное меню</span>
        </div>
        <div className={styles.feature}>
            <Heart size={18} />
            <span>Готовим с душой</span>
        </div>
        </div>

          <div className={styles.priceSection}>
            <div className={styles.price}>
              <span className={styles.priceLabel}>Цена</span>
              <span className={styles.priceValue}>{dish.price} ₽</span>
            </div>
            
            <div className={styles.quantitySelector}>
              <button 
                onClick={decrementQuantity}
                className={styles.qtyBtn}
                disabled={quantity <= 1}
              >
                <Minus size={18} />
              </button>
              <span className={styles.qtyValue}>{quantity}</span>
              <button 
                onClick={incrementQuantity}
                className={styles.qtyBtn}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <button 
            onClick={handleAddToCart}
            disabled={isAdding || !dish.isAvailable}
            className={styles.addToCartBtn}
          >
            <ShoppingCart size={20} />
            {isAdding ? 'Добавление...' : `В корзину • ${dish.price * quantity} ₽`}
          </button>

          {!dish.isAvailable && (
            <div className={styles.unavailable}>
              ⚠️ Блюдо временно недоступно
            </div>
          )}
        </div>
      </div>

      {/* Похожие блюда */}
      {similarDishes.length > 0 && (
        <div className={styles.similarSection}>
          <h2 className={styles.similarTitle}>
            <Utensils size={24} />
            Похожие блюда
          </h2>
          <div className={styles.similarGrid}>
            {similarDishes.map(similar => (
              <Link 
                key={similar.id} 
                href={`/menu/${similar.slug}`}
                className={styles.similarCard}
              >
                <div className={styles.similarImageWrapper}>
                  <ImageWithFallback
                    src={similar.imageUrl || ''}
                    alt={similar.name}
                    fallback="dish"
                  />
                </div>
                <div className={styles.similarInfo}>
                  <h3>{similar.name}</h3>
                  <div className={styles.similarPrice}>{similar.price} ₽</div>
                  {similar.weight && (
                    <div className={styles.similarWeight}>{similar.weight}г</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <RecentlyViewed />
    </div>
  );
}