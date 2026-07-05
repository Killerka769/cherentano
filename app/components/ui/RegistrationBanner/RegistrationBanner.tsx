'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, Gift, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import styles from './RegistrationBanner.module.scss';

// Ключи для localStorage
const BANNER_LAST_SHOW_KEY = 'registrationBannerLastShow';
const BANNER_IS_VISIBLE_KEY = 'registrationBannerIsVisible';

export default function RegistrationBanner() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Если пользователь зарегистрирован — баннер не показываем
    if (user) {
      setIsVisible(false);
      return;
    }

    // Проверяем состояние баннера при загрузке
    const isVisibleState = localStorage.getItem(BANNER_IS_VISIBLE_KEY);
    const lastShow = localStorage.getItem(BANNER_LAST_SHOW_KEY);
    
    // Если баннер был закрыт меньше 2 минут назад — не показываем
    if (lastShow && isVisibleState === 'false') {
      const timeSinceClose = Date.now() - parseInt(lastShow);
      if (timeSinceClose < 120000) { // 2 минуты
        // Не показываем, но проверяем позже
        const remaining = Math.ceil((120000 - timeSinceClose) / 1000);
        timeoutRef.current = setTimeout(() => {
          checkAndShowBanner();
        }, remaining * 1000);
        return;
      }
    }
    
    // Показываем баннер если он не был закрыт
    if (isVisibleState === 'true') {
      setIsVisible(true);
    } else {
      checkAndShowBanner();
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [user]);

  const checkAndShowBanner = () => {
    // Проверяем, прошло ли больше 2 минут с последнего закрытия
    const lastShow = localStorage.getItem(BANNER_LAST_SHOW_KEY);
    const now = Date.now();
    const TWO_MINUTES = 2 * 60 * 1000;
    
    if (!lastShow || (now - parseInt(lastShow)) > TWO_MINUTES) {
      showBanner();
    }
  };

  const showBanner = () => {
    if (!user) {
      setIsVisible(true);
      localStorage.setItem(BANNER_IS_VISIBLE_KEY, 'true');
      localStorage.setItem(BANNER_LAST_SHOW_KEY, Date.now().toString());
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    localStorage.setItem(BANNER_IS_VISIBLE_KEY, 'false');
    localStorage.setItem(BANNER_LAST_SHOW_KEY, Date.now().toString());
    
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 300);
  };

  if (!isVisible || user) return null;

  return (
    <div 
      className={`${styles.banner} ${isClosing ? styles.closing : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.left}>
            <div className={styles.iconWrapper}>
              <div className={styles.iconBg}>
                <Gift size={28} className={styles.giftIcon} />
              </div>
              <div className={styles.particles}>
                <span className={`${styles.particle} ${styles.p1}`}>✨</span>
                <span className={`${styles.particle} ${styles.p2}`}>⭐</span>
                <span className={`${styles.particle} ${styles.p3}`}>🎉</span>
                <span className={`${styles.particle} ${styles.p4}`}>💫</span>
              </div>
            </div>
          </div>

          <div className={styles.center}>
            <div className={styles.badge}>
              <Sparkles size={14} />
              <span>Специальное предложение</span>
            </div>
            <h3 className={styles.title}>
              <span className={styles.highlight}>-10%</span> на первый заказ!
            </h3>
            <p className={styles.description}>
              Станьте частью семьи <strong>Челентано</strong> и получите 
              <span className={styles.discountText}> 10% скидку</span> на ваш первый заказ. 
              Просто зарегистрируйтесь — и скидка уже ваша!
            </p>
            <div className={styles.perks}>
              <span className={styles.perk}>🎁 Скидка 10%</span>
              <span className={styles.perk}>📱 Бонус при регистрации</span>
              <span className={styles.perk}>⏳ Действует 7 дней</span>
            </div>
          </div>

          <div className={styles.right}>
            <Link href="/register" className={`${styles.registerBtn} ${isHovered ? styles.hovered : ''}`}>
              <span>Зарегистрироваться</span>
              <ArrowRight size={20} className={styles.arrowIcon} />
              <span className={styles.btnGlow}></span>
            </Link>
            <button onClick={handleClose} className={styles.closeBtn} aria-label="Закрыть">
              <X size={22} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}