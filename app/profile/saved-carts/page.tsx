'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Trash2, ShoppingCart, ArrowLeft, Plus, Clock } from 'lucide-react';
import { useCart } from '@/app/contexts/CartContext';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface SavedCart {
  id: string;
  name: string;
  items: string;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export default function SavedCartsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { addToCart, clearCart } = useCart();
  const [savedCarts, setSavedCarts] = useState<SavedCart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [cartName, setCartName] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchSavedCarts();
    }
  }, [user]);

  const fetchSavedCarts = async () => {
    try {
      const res = await fetch('/api/saved-carts');
      const data = await res.json();
      if (data.savedCarts) {
        setSavedCarts(data.savedCarts);
      }
    } catch (error) {
      console.error('Failed to fetch saved carts:', error);
      toast.error('Ошибка загрузки сохраненных корзин');
    } finally {
      setIsLoading(false);
    }
  };

  const parseItems = (itemsStr: string): CartItem[] => {
    if (!itemsStr) return [];
    try {
      const parsed = JSON.parse(itemsStr);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch (e) {
      console.error('Failed to parse items:', e);
      return [];
    }
  };

  const loadCart = (cart: SavedCart) => {
    const items = parseItems(cart.items);
    if (items.length === 0) {
      toast.error('Корзина пуста или повреждена');
      return;
    }
    
    clearCart();
    items.forEach((item: CartItem) => {
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
      }, item.quantity);
    });
    toast.success(`Корзина "${cart.name}" загружена`);
    router.push('/cart');
  };

  const deleteCart = async (id: string) => {
    try {
      const res = await fetch(`/api/saved-carts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedCarts(prev => prev.filter(c => c.id !== id));
        toast.success('Сохраненная корзина удалена');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  const saveCurrentCart = async () => {
    if (!cartName.trim()) {
      toast.error('Введите название корзины');
      return;
    }

    const cartItems = localStorage.getItem('cart');
    let itemsArray: CartItem[] = [];
    
    try {
      itemsArray = cartItems ? JSON.parse(cartItems) : [];
    } catch (e) {
      console.error('Failed to parse cart:', e);
    }
    
    if (itemsArray.length === 0) {
      toast.error('Корзина пуста. Добавьте блюда перед сохранением.');
      return;
    }
    
    const total = itemsArray.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0);

    try {
      const res = await fetch('/api/saved-carts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cartName,
          items: itemsArray,
          total
        })
      });
      
      if (res.ok) {
        toast.success('Корзина сохранена');
        setShowSaveModal(false);
        setCartName('');
        fetchSavedCarts();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Ошибка сохранения');
      }
    } catch (error) {
      toast.error('Ошибка сохранения');
    }
  };

  if (loading || isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>Загрузка...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/profile" className={styles.backLink}>
          <ArrowLeft size={20} />
          Назад в профиль
        </Link>
        <h1 className={styles.title}>
          <Package size={28} />
          Мои сеты
        </h1>
        <p className={styles.subtitle}>Сохраненные комбинации блюд</p>
      </div>

      <button onClick={() => setShowSaveModal(true)} className={styles.saveCurrentBtn}>
        <Plus size={18} />
        Сохранить текущую корзину как сет
      </button>

      {savedCarts.length === 0 ? (
        <div className={styles.empty}>
          <Package size={64} />
          <h3>Сохраненных сетов пока нет</h3>
          <p>Соберите корзину и сохраните её как сет, чтобы заказать повторно</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {savedCarts.map(cart => {
            const items = parseItems(cart.items);
            return (
              <div key={cart.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3>{cart.name}</h3>
                  <span className={styles.date}>
                    <Clock size={12} />
                    {new Date(cart.updatedAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className={styles.items}>
                  {items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className={styles.item}>
                      {item.name} x{item.quantity}
                    </div>
                  ))}
                  {items.length > 3 && (
                    <div className={styles.more}>+ ещё {items.length - 3}</div>
                  )}
                  {items.length === 0 && (
                    <div className={styles.emptyItems}>Нет товаров</div>
                  )}
                </div>
                <div className={styles.cardFooter}>
                  <div className={styles.total}>{cart.total} ₽</div>
                  <div className={styles.actions}>
                    <button 
                      onClick={() => loadCart(cart)} 
                      className={styles.loadBtn}
                      disabled={items.length === 0}
                    >
                      <ShoppingCart size={16} />
                      Заказать
                    </button>
                    <button onClick={() => deleteCart(cart.id)} className={styles.deleteBtn}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Модальное окно сохранения */}
      {showSaveModal && (
        <div className={styles.modal} onClick={() => setShowSaveModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3>Сохранить корзину</h3>
            <input
              type="text"
              placeholder="Название сета (например: 'Мой ужин', 'Пивной сет')"
              value={cartName}
              onChange={(e) => setCartName(e.target.value)}
              autoFocus
            />
            <div className={styles.modalButtons}>
              <button onClick={saveCurrentCart} className={styles.saveBtn}>
                Сохранить
              </button>
              <button onClick={() => setShowSaveModal(false)} className={styles.cancelBtn}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}