'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, MapPin, Clock, Mail, Heart } from 'lucide-react';
import styles from './Footer.module.scss';

interface Settings {
  phone: string;
  email: string;
  address: string;
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  workDays: any;
}

export default function Footer() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data.settings);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const getTodayHours = () => {
    if (!settings?.workDays) return '11:00 - 23:00';
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const workDays = typeof settings.workDays === 'string' 
      ? JSON.parse(settings.workDays) 
      : settings.workDays;
    
    return workDays[today] 
      ? `${workDays[today].open} - ${workDays[today].close}`
      : '11:00 - 23:00';
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Колонка 1: О ресторане */}
          <div className={styles.column}>
            <h3 className={styles.title}>Челентано</h3>
            <p className={styles.description}>
              Ресторан дагестанской и европейской кухни в Махачкале. 
              Уютная атмосфера, авторские блюда и атмосфера, в которой каждый гость чувствует себя самым долгожданным.
            </p>
          </div>

          {/* Колонка 2: Контакты */}
          <div className={styles.column}>
            <h3 className={styles.title}>Контакты</h3>
            <div className={styles.contactItem}>
              <Phone size={18} />
              <a href={`tel:${settings?.phone || '+79882938907'}`}>
                {settings?.phone || '+7 (988) 293-89-07'}
              </a>
            </div>
            <div className={styles.contactItem}>
              <MapPin size={18} />
              <span>{settings?.address || 'Махачкала, ул. Агасиева, 5А'}</span>
            </div>
            <div className={styles.contactItem}>
              <Clock size={18} />
              <span>Ежедневно {getTodayHours()}</span>
            </div>
            <div className={styles.contactItem}>
              <Mail size={18} />
              <a href={`mailto:${settings?.email || 'info@cherentano.ru'}`}>
                {settings?.email || 'info@cherentano.ru'}
              </a>
            </div>
            <div className={styles.contactItem}>
              <span className={styles.socialLabel}>Мы в соцсетях:</span>
              <span className={styles.socialHandle}>@chelentano</span>
            </div>
          </div>

          {/* Колонка 3: Быстрые ссылки */}
          <div className={styles.column}>
            <h3 className={styles.title}>Меню</h3>
            <ul className={styles.links}>
              <li><Link href="/menu">Наше меню</Link></li>
              <li><Link href="/recipes">Рецепты</Link></li>
              <li><Link href="/charity" className={styles.charityBanner}>Накорми нуждающегося</Link></li>
              <li><Link href="/delivery">Доставка еды</Link></li>
              <li><Link href="/booking">Бронирование стола</Link></li>
              <li><Link href="/blog">Блог</Link></li>
            </ul>
          </div>

          {/* Колонка 4: Дополнительно */}
          <div className={styles.column}>
            <h3 className={styles.title}>Информация</h3>
            <ul className={styles.links}>
              <li><Link href="/about">О нас</Link></li>
              <li><Link href="/contacts">Контакты</Link></li>
              <li><Link href="/reviews">Отзывы</Link></li>
              <li><Link href="/privacy">Политика конфиденциальности</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>
            © {currentYear} Ресторан «Челентано». Все права защищены.
          </p>
          <p className={styles.heart}>
            Сделано с <Heart size={14} fill="#c4492c" color="#c4492c" /> для наших гостей
          </p>
        </div>
      </div>
    </footer>
  );
}