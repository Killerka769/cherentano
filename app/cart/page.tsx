'use client';

import { useCart } from '@/app/contexts/CartContext';
import CartItem from '@/app/components/cart/CartItem/CartItem';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, AlertCircle } from 'lucide-react';
import styles from './page.module.scss';
import { useAuth } from '../contexts/AuthContext';

export default function CartPage() {
  const { items, getTotal, clearCart } = useCart();
  const total = getTotal();
  const deliveryPrice = total > 1000 ? 0 : 150;
  const finalTotal = total + deliveryPrice;
  const { user } = useAuth();

  {items.length > 0 && !user && (
    <div className={styles.warning}>
      <AlertCircle size={20} />
      <div>
        <strong>Для оформления заказа необходимо войти в аккаунт</strong>
        <p>Войдите или зарегистрируйтесь, чтобы продолжить оформление заказа</p>
      </div>
      <Link href="/login" className={styles.loginLink}>Войти</Link>
    </div>
  )}

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
            <span>{total} ₽</span>
          </div>
          
          <div className={styles.summaryRow}>
            <span>Доставка</span>
            <span>{deliveryPrice === 0 ? 'Бесплатно' : `${deliveryPrice} ₽`}</span>
          </div>
          
          {deliveryPrice > 0 && (
            <div className={styles.freeDeliveryNote}>
              Закажите ещё на {1000 - total} ₽ для бесплатной доставки
            </div>
          )}
          
          <div className={styles.divider}></div>
          
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>К оплате</span>
            <span>{finalTotal} ₽</span>
          </div>
          
          {!user ? (
            <Link href="/login" className={styles.loginToCheckout}>
              Войдите, чтобы оформить заказ
            </Link>
          ) : (
            <Link href="/checkout" className={styles.checkoutBtn}>
              Оформить заказ
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}