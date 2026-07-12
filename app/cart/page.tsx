'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/app/contexts/CartContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, AlertCircle, Utensils, Truck } from 'lucide-react';
import CartItem from '@/app/components/cart/CartItem/CartItem';
import DiscountInput from '@/app/components/cart/DiscountInput/DiscountInput';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

export default function CartPage() {
  const { items, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [menuType, setMenuType] = useState<'pickup' | 'delivery'>('pickup');
  
  const subtotal = getTotal();
  const total = subtotal - discountAmount;

  // Загружаем тип меню из localStorage
  useEffect(() => {
    const savedType = localStorage.getItem('selectedMenuType');
    if (savedType === 'delivery' || savedType === 'pickup') {
      setMenuType(savedType);
    } else {
      setMenuType('pickup');
      localStorage.setItem('selectedMenuType', 'pickup');
    }
  }, []);

  const handleDiscountApplied = (data: any) => {
    setAppliedDiscount(data);
    setDiscountAmount(data.discountAmount);
  };

  const handleDiscountRemoved = () => {
    setAppliedDiscount(null);
    setDiscountAmount(0);
  };

  const switchMenuType = (type: 'pickup' | 'delivery') => {
    setMenuType(type);
    localStorage.setItem('selectedMenuType', type);
    toast.success(type === 'pickup' ? 'Выбрано: в ресторане' : 'Выбрано: доставка');
  };

  const handleCheckout = () => {
    if (!user) {
      router.push('/login');
      return;
    }

    // 👇 ПРОВЕРЯЕМ ВСЕ БЛЮДА В КОРЗИНЕ
    const invalidItems = items.filter(item => {
      if (menuType === 'pickup') {
        // Для ресторана НЕ подходят только DELIVERY
        return item.menuType === 'DELIVERY';
      } else {
        // Для доставки НЕ подходят только PICKUP
        return item.menuType === 'PICKUP';
      }
    });
    
    // 🔴 ЕСЛИ ЕСТЬ НЕСООТВЕТСТВИЕ — ПОКАЗЫВАЕМ ОШИБКУ
    if (invalidItems.length > 0) {
      const names = invalidItems.map(i => i.name).join(', ');
      toast.error(`⚠️ Блюда не соответствуют типу заказа: ${names}`);
      return;
    }
    
    localStorage.setItem('selectedMenuType', menuType);
    const params = new URLSearchParams();

    if (appliedDiscount) {
      params.set('discountId', appliedDiscount.discountId);
      params.set('discountCode', appliedDiscount.discountCode);
      params.set('discountAmount', String(appliedDiscount.discountAmount));
      params.set('isIndividual', String(appliedDiscount.isIndividual || false));
    }
    
    router.push(`/checkout?${params.toString()}`);
  };

  if (items.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <ShoppingBag size={80} strokeWidth={1} />
          <h2>Корзина пуста</h2>
          <p>Добавьте блюда из меню, чтобы сделать заказ</p>
          <Link href="/menu" className={styles.continueBtn}>
            Перейти в меню
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/menu" className={styles.backLink}>
          <ArrowLeft size={20} />
          Вернуться в меню
        </Link>
        <h1 className={styles.title}>Корзина</h1>
        <button onClick={clearCart} className={styles.clearBtn}>
          Очистить корзину
        </button>
      </div>

      {/* Выбор типа заказа */}
      <div className={styles.orderTypeSelector}>
        <span className={styles.orderTypeLabel}>Тип заказа:</span>
        <div className={styles.orderTypeButtons}>
          <button
            onClick={() => switchMenuType('pickup')}
            className={`${styles.orderTypeBtn} ${menuType === 'pickup' ? styles.active : ''}`}
          >
            <Utensils size={18} />
            В ресторане
          </button>
          <button
            onClick={() => switchMenuType('delivery')}
            className={`${styles.orderTypeBtn} ${menuType === 'delivery' ? styles.active : ''}`}
          >
            <Truck size={18} />
            Доставка
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.items}>
          {items.map(item => (
            <CartItem
              key={item.id}
              id={item.id}
              name={item.name}
              price={item.price}
              quantity={item.quantity}
              imageUrl={item.imageUrl}
            />
          ))}
        </div>

        <div className={styles.summary}>
          <h3 className={styles.summaryTitle}>Итого</h3>
          
          <div className={styles.summaryRow}>
            <span>Товары ({items.reduce((sum, item) => sum + item.quantity, 0)} шт.)</span>
            <span>{subtotal} ₽</span>
          </div>
          
          {menuType === 'delivery' && (
            <div className={styles.deliveryInfo}>
              <Truck size={16} />
              <span>Доставка осуществляется такси. Оплата такси производится клиентом самостоятельно при получении заказа.</span>
            </div>
          )}

          <DiscountInput
            orderTotal={subtotal}
            items={items}
            onDiscountApplied={handleDiscountApplied}
            onDiscountRemoved={handleDiscountRemoved}
            initialDiscount={appliedDiscount}
          />
          
          {discountAmount > 0 && (
            <div className={`${styles.summaryRow} ${styles.discount}`}>
              <span>Скидка</span>
              <span>-{discountAmount} ₽</span>
            </div>
          )}
          
          <div className={styles.divider}></div>
          
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>К оплате</span>
            <span>{total} ₽</span>
          </div>

          {items.length > 0 && !user && (
            <div className={styles.warning}>
              <AlertCircle size={20} />
              <div>
                <strong>Для оформления заказа необходимо войти в аккаунт</strong>
                <p>Войдите или зарегистрируйтесь, чтобы продолжить</p>
              </div>
              <Link href="/login" className={styles.loginLink}>Войти</Link>
            </div>
          )}
          
          {!user ? (
            <Link href="/login" className={styles.loginToCheckout}>
              🔐 Войдите, чтобы оформить заказ
            </Link>
          ) : (
            <button onClick={handleCheckout} className={styles.checkoutBtn}>
              Оформить заказ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}