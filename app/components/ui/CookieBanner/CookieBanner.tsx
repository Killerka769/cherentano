'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';
import styles from './CookieBanner.module.scss';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Проверяем, принял ли пользователь cookie
    const cookieAccepted = localStorage.getItem('cookie-accepted');
    
    if (!cookieAccepted) {
      // Показываем баннер через 1 секунду после загрузки
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-accepted', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <Cookie size={24} />
        </div>
        <div className={styles.text}>
          <strong>Мы используем cookie</strong>
          <p>
            Сайт использует файлы cookie для аналитики и улучшения работы. 
            Продолжая пользоваться сайтом, вы соглашаетесь с{' '}
            <Link href="/privacy" target="_blank">политикой конфиденциальности</Link>.
          </p>
        </div>
        <button onClick={handleAccept} className={styles.acceptBtn}>
          Принять
        </button>
        <button onClick={() => setIsVisible(false)} className={styles.closeBtn}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
}