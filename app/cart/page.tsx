'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/app/contexts/CartContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, AlertCircle } from 'lucide-react';
import CartItem from '@/app/components/cart/CartItem/CartItem';
import DiscountInput from '@/app/components/cart/DiscountInput/DiscountInput';
import styles from './page.module.scss';

export default function CartPage() {
  const { items, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  
  const subtotal = getTotal();
  const deliveryPrice = subtotal > 1000 ? 0 : 150;
  const total = subtotal + deliveryPrice - discountAmount;

  const handleDiscountApplied = (data: any) => {
    setAppliedDiscount(data);
    setDiscountAmount(data.discountAmount);
  };

  const handleDiscountRemoved = () => {
    setAppliedDiscount(null);
    setDiscountAmount(0);
  };

  const handleCheckout = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Передаем данные скидки через URL параметры
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
          
          <div className={styles.summaryRow}>
            <span>Доставка</span>
            <span>{deliveryPrice === 0 ? 'Бесплатно' : `${deliveryPrice} ₽`}</span>
          </div>
          
          {deliveryPrice > 0 && (
            <div className={styles.freeDeliveryNote}>
              Закажите ещё на {1000 - subtotal} ₽ для бесплатной доставки
            </div>
          )}

          {/* Блок скидок */}
          <DiscountInput
            orderTotal={subtotal + deliveryPrice}
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