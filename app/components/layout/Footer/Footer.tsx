'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, MapPin, Clock, Mail, MessageSquare, Send, Heart } from 'lucide-react';
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
            <div className={styles.socials}>
              <a 
                href={settings?.instagram || 'https://instagram.com/cherentano'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.socialLink}
                aria-label="Instagram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.66 0 1.86.01 2.51.04.6.03 1 .13 1.36.27.37.14.69.34.99.65.32.3.51.61.65.99.14.36.24.76.27 1.36.03.65.04.85.04 2.51s-.01 1.86-.04 2.51c-.03.6-.13 1-.27 1.36-.14.37-.34.69-.65.99-.3.32-.61.51-.99.65-.36.14-.76.24-1.36.27-.65.03-.85.04-2.51.04s-1.86-.01-2.51-.04c-.6-.03-1-.13-1.36-.27-.37-.14-.69-.34-.99-.65-.32-.3-.51-.61-.65-.99-.14-.36-.24-.76-.27-.16l-.01-1.2c-.03-.65-.04-.85-.04-2.51s.01-1.86.04-2.51c.03-.6.13-1 .27-1.36.14-.37.34-.69.65-.99.3-.32.61-.51.99-.65.36-.14.76-.24 1.36-.27.65-.03.85-.04 2.51-.04zm0 1.8c-1.63 0-1.82.01-2.46.04-.59.03-.91.12-1.12.21-.29.11-.49.24-.71.46-.22.22-.35.42-.46.71-.09.21-.18.53-.21 1.12-.03.64-.04.83-.04 2.46s.01 1.82.04 2.46c.03.59.12.91.21 1.12.11.29.24.49.46.71.22.22.42.35.71.46.21.09.53.18 1.12.21.64.03.83.04 2.46.04s1.82-.01 2.46-.04c.59-.03.91-.12 1.12-.21.29-.11.49-.24.71-.46.22-.22.35-.42.46-.71.09-.21.18-.53.21-1.12.03-.64.04-.83.04-2.46s-.01-1.82-.04-2.46c-.03-.59-.12-.91-.21-1.12-.11-.29-.24-.49-.46-.71-.22-.22-.42-.35-.71-.46-.21-.09-.53-.18-.16-.01l-1.12-.21c-.64-.03-.83-.04-.04-.04zm0 2.4c1.99 0 3.6 1.61 3.6 3.6s-1.61 3.6-3.6 3.6-3.6-1.61-3.6-3.6 1.61-3.6 3.6-3.6zm0 1.8c-.99 0-1.8.81-1.8 1.8s.81 1.8 1.8 1.8 1.8-.81 1.8-1.8-.81-1.8-1.8-1.8zm3.74-2.9c0 .46-.38.84-.84.84s-.84-.38-.84-.84.38-.84.84-.84.84.38.84.84z"/>
                </svg>
              </a>
              <a 
                href={settings?.telegram || 'https://t.me/cherentano_bot'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.socialLink}
                aria-label="Telegram"
              >
                <Send size={20} />
              </a>
              <a 
                href={settings?.whatsapp || 'https://wa.me/79882938907'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.socialLink}
                aria-label="WhatsApp"
              >
                <MessageSquare size={20} />
              </a>
            </div>
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