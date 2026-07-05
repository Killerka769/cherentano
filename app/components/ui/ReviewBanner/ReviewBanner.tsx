'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gift, Sparkles, ShoppingBag, MessageCircle, X, ArrowRight } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import styles from './ReviewBanner.module.scss';

export default function ReviewBanner() {
  const { user } = useAuth();
  const [hasCompletedOrders, setHasCompletedOrders] = useState(false);
  const [hasReview, setHasReview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (user) {
      checkUserStatus();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Проверяем, закрывал ли пользователь баннер
    const closed = localStorage.getItem('reviewBannerClosed');
    if (closed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const checkUserStatus = async () => {
    try {
      // Проверяем заказы
      const ordersRes = await fetch('/api/orders');
      const ordersData = await ordersRes.json();
      const hasCompleted = ordersData.orders?.some((o: any) => o.status === 'COMPLETED') || false;
      setHasCompletedOrders(hasCompleted);

      // Проверяем отзыв
      const reviewRes = await fetch('/api/user/has-reviewed');
      const reviewData = await reviewRes.json();
      setHasReview(reviewData.hasReviewed || false);
    } catch (error) {
      console.error('Failed to check user status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem('reviewBannerClosed', 'true');
    }, 300);
  };

  // Не показываем если:
  // - Пользователь не авторизован
  // - Уже есть отзыв
  // - Баннер закрыт
  if (!user || hasReview || !isVisible || isLoading) {
    return null;
  }

  // Состояние 1: Нет заказов
  if (!hasCompletedOrders) {
    return (
      <div className={`${styles.banner} ${styles.primary} ${isClosing ? styles.closing : ''}`}>
        <div className={styles.container}>
          <div className={styles.content}>
            <div className={styles.iconWrapper}>
              <ShoppingBag size={28} className={styles.icon} />
            </div>
            <div className={styles.text}>
              <h3>📦 Сделайте первый заказ!</h3>
              <p>
                После получения заказа вы сможете оставить отзыв и получить 
                <strong className={styles.highlight}> 10% скидку</strong> на следующий заказ!
              </p>
            </div>
            <div className={styles.actions}>
              <Link href="/menu" className={styles.primaryBtn}>
                Перейти в меню
                <ArrowRight size={18} />
              </Link>
              <button onClick={handleClose} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Состояние 2: Есть заказы, но нет отзыва
  return (
    <div className={`${styles.banner} ${styles.success} ${isClosing ? styles.closing : ''}`}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.iconWrapper}>
            <MessageCircle size={28} className={styles.icon} />
            <Sparkles size={16} className={styles.sparkle} />
          </div>
          <div className={styles.text}>
            <h3>⭐ Оставьте отзыв и получите скидку!</h3>
            <p>
              Поделитесь впечатлениями о ресторане и получите 
              <strong className={styles.highlight}> 10% скидку</strong> на следующий заказ. 
              <span className={styles.perk}> 🎁 Действует 30 дней</span>
            </p>
          </div>
          <div className={styles.actions}>
            <Link href="#review-form" className={styles.primaryBtn}>
              Написать отзыв
              <Gift size={18} />
            </Link>
            <button onClick={handleClose} className={styles.closeBtn}>
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}