'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShoppingCart, Plus, Minus, Heart, Share2, 
  Flame, Clock, Award, ArrowLeft,
  Star, ChefHat, Truck, Coffee
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
  categoryId: number;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  isAvailable: boolean;
}

interface ViewedDish {
  id: number;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
  viewedAt: number;
}

interface SimilarDish {
  id: number;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
  weight: number | null;
}

export default function DishPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [dish, setDish] = useState<Dish | null>(null);
  const [similarDishes, setSimilarDishes] = useState<SimilarDish[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  const slug = params?.slug as string;

  useEffect(() => {
    if (slug) {
      fetchDish();
    }
  }, [slug]);

  useEffect(() => {
    if (user && dish) {
      checkFavorite();
    }
  }, [user, dish]);

  const fetchDish = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/dishes/${slug}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push('/menu');
        }
        return;
      }
      const data = await res.json();
      setDish(data.dish);
      setSimilarDishes(data.similarDishes || []);
    } catch (error) {
      console.error('Failed to fetch dish:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (dish) {
      saveToRecentlyViewed();
    }
  }, [dish]);

  const saveToRecentlyViewed = () => {
    if (!dish) return;
    
    try {
      const stored = localStorage.getItem('recentlyViewed');
      let recent: ViewedDish[] = stored ? JSON.parse(stored) : [];
      
      // Удаляем если уже есть
      recent = recent.filter(item => item.id !== dish.id);
      
      // Добавляем в начало
      recent.unshift({
        id: dish.id,
        name: dish.name,
        slug: dish.slug,
        price: dish.price,
        imageUrl: dish.imageUrl,
        viewedAt: Date.now()
      });
      
      // Оставляем только 10 последних
      recent = recent.slice(0, 10);
      
      localStorage.setItem('recentlyViewed', JSON.stringify(recent));
      console.log('Saved to recently viewed:', recent);
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
        toast.success('Добавлено в избранное');
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

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!dish) {
    return (
      <div className={styles.notFound}>
        <h2>Блюдо не найдено</h2>
        <p>Возможно, оно было удалено или перемещено</p>
        <Link href="/menu" className={styles.backBtn}>
          <ArrowLeft size={18} />
          Вернуться в меню
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Хлебные крошки */}
      <div className={styles.breadcrumbs}>
        <Link href="/">Главная</Link>
        <span>/</span>
        <Link href="/menu">Меню</Link>
        <span>/</span>
        <Link href={`/menu?category=${dish.category.slug}`}>{dish.category.name}</Link>
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
            {dish.category.name}
          </div>
          
          <h1 className={styles.title}>{dish.name}</h1>
          
          <div className={styles.rating}>
            <div className={styles.stars}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="#f4b942" color="#f4b942" />
              ))}
            </div>
            <span className={styles.ratingValue}>Новое блюдо</span>
            <span className={styles.reviewsCount}>• Попробуйте первым</span>
          </div>

          {dish.description && (
            <div className={styles.description}>
              <h3>Описание</h3>
              <p>{dish.description}</p>
            </div>
          )}

          <div className={styles.features}>
            <div className={styles.feature}>
              <Flame size={18} />
              <span>Традиционная кухня</span>
            </div>
            <div className={styles.feature}>
              <Clock size={18} />
              <span>Готовим 15-25 мин</span>
            </div>
            <div className={styles.feature}>
              <Award size={18} />
              <span>Из свежих продуктов</span>
            </div>
            <div className={styles.feature}>
              <Truck size={18} />
              <span>Бесплатная доставка от 1000 ₽</span>
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
            <Coffee size={24} />
            Похожие блюда
          </h2>
          <div className={styles.similarGrid}>
            {similarDishes.map(similar => (
              <Link 
                key={similar.id} 
                href={`/menu/${similar.slug}`}
                className={styles.similarCard}
              >
                <div className={styles.similarImage}>
                  <ImageWithFallback
                    src={similar.imageUrl || ''}
                    alt={similar.name}
                    className={styles.similarImage}
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

      {/* Бонусный блок
      <div className={styles.bonusSection}>
        <div className={styles.bonusCard}>
          <div className={styles.bonusIcon}>🎁</div>
          <div className={styles.bonusContent}>
            <h3>Первый заказ со скидкой 10%!</h3>
            <p>Зарегистрируйтесь и получите скидку на первый заказ</p>
          </div>
          <Link href="/register" className={styles.bonusBtn}>
            Зарегистрироваться
          </Link>
        </div>
      </div> */}
      <RecentlyViewed />
    </div>
  );
}