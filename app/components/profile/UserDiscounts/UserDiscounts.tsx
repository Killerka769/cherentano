'use client';

import { useState, useEffect } from 'react';
import { Percent, Tag, Calendar, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import styles from './UserDiscounts.module.scss';

interface Discount {
  id: number;
  code: string;
  name: string;
  description: string | null;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrderAmount: number | null;
  discountType?: 'common' | 'individual';
  userDiscountId?: number | null;
  expiresAt?: string | null;
  isFirstOrder?: boolean;
  isBirthday?: boolean;
  uniqueId?: string;
}

export default function UserDiscounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const res = await fetch('/api/discounts');
      const data = await res.json();
      console.log('UserDiscounts data:', data); // 👈 ОТЛАДКА
      setDiscounts(data.discounts || []);
    } catch (error) {
      console.error('Failed to fetch discounts:', error);
      toast.error('Ошибка загрузки скидок');
    } finally {
      setIsLoading(false);
    }
  };

  const isDiscountExpired = (expiresAt?: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return <div className={styles.loader}>Загрузка скидок...</div>;
  }

  if (discounts.length === 0) {
    return (
      <div className={styles.empty}>
        <Percent size={48} />
        <h3>Нет доступных скидок</h3>
        <p>Следите за акциями и специальными предложениями</p>
        <Link href="/menu" className={styles.menuBtn}>
          Перейти в меню
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>Доступные скидки</h2>
      <div className={styles.grid}>
        {discounts.map((discount) => {
          const isExpired = isDiscountExpired(discount.expiresAt);
          const isIndividual = discount.discountType === 'individual';
          const isFirstOrder = discount.isFirstOrder;
          
          return (
            <div 
              key={discount.uniqueId || `discount-${discount.id}`}
              className={`${styles.card} ${isExpired ? styles.expired : ''} ${isIndividual ? styles.individual : ''}`}
            >
              <div className={styles.header}>
                <span className={styles.code}>{discount.code}</span>
                <span className={styles.badge}>
                  {discount.type === 'PERCENT' ? `${discount.value}%` : `${discount.value} ₽`}
                </span>
              </div>
              <h3>{discount.name}</h3>
              {discount.description && (
                <p className={styles.description}>{discount.description}</p>
              )}
              <div className={styles.meta}>
                {discount.minOrderAmount && (
                  <span>Минимальный заказ: {discount.minOrderAmount} ₽</span>
                )}
                {isFirstOrder && (
                  <span className={styles.special}>🎁 Первый заказ</span>
                )}
                {discount.isBirthday && (
                  <span className={styles.special}>🎂 День рождения</span>
                )}
                {isIndividual && (
                  <span className={styles.individualBadge}>🎯 Индивидуальная</span>
                )}
                {discount.expiresAt && (
                  <span className={styles.date}>
                    <Clock size={14} />
                    До {new Date(discount.expiresAt).toLocaleDateString('ru-RU')}
                  </span>
                )}
              </div>
              <div className={styles.footer}>
                <span className={isExpired ? styles.inactive : styles.active}>
                  {isExpired ? 'Истекла' : 'Доступна'}
                </span>
                <button 
                  className={styles.useBtn}
                  onClick={() => {
                    navigator.clipboard.writeText(discount.code);
                    toast.success(`Код ${discount.code} скопирован!`);
                  }}
                >
                  Скопировать код
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}