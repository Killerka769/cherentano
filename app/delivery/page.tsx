'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Truck, Clock, MapPin, CreditCard, Phone, CheckCircle, ArrowLeft } from 'lucide-react';
import styles from './page.module.scss';

interface Settings {
  phone: string;
  email: string;
  address: string;
  deliveryMinSum: number;
  deliveryPrice: number;
  workDays: any;
}

export default function DeliveryPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={18} />
          На главную
        </Link>
        <h1 className={styles.title}>🚚 Доставка еды</h1>
        <p className={styles.subtitle}>Быстрая и вкусная доставка в Махачкале</p>
      </div>

      <div className={styles.content}>
        {/* Секция 1: Как мы доставляем */}
        <div className={styles.section}>
          <h2>Как мы доставляем</h2>
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.icon}>
                <Clock size={32} />
              </div>
              <h3>15-30 минут</h3>
              <p>Среднее время доставки по городу</p>
            </div>
            <div className={styles.card}>
              <div className={styles.icon}>
                <Truck size={32} />
              </div>
              <h3>Бесплатная доставка</h3>
              <p>При заказе от {settings?.deliveryMinSum || 1000} ₽</p>
            </div>
            <div className={styles.card}>
              <div className={styles.icon}>
                <MapPin size={32} />
              </div>
              <h3>Доставка по городу</h3>
              <p>Доставляем в любую точку Махачкалы</p>
            </div>
            <div className={styles.card}>
              <div className={styles.icon}>
                <CreditCard size={32} />
              </div>
              <h3>Оплата любым способом</h3>
              <p>Наличные, карта курьеру, онлайн</p>
            </div>
          </div>
        </div>

        {/* Секция 2: Зоны доставки */}
        <div className={styles.section}>
          <h2>📍 Зоны доставки</h2>
          <div className={styles.zones}>
            <div className={styles.zoneCard}>
              <span className={styles.zoneBadge}>✅</span>
              <div>
                <strong>Центр города</strong>
                <p>Ул. Агасиева, пр. Расула Гамзатова и прилегающие</p>
              </div>
            </div>
            <div className={styles.zoneCard}>
              <span className={styles.zoneBadge}>✅</span>
              <div>
                <strong>Районы</strong>
                <p>Махачкала-1, Махачкала-2, Университетский</p>
              </div>
            </div>
            <div className={styles.zoneCard}>
              <span className={styles.zoneBadge}>⏳</span>
              <div>
                <strong>Отдаленные районы</strong>
                <p>Время доставки увеличивается до 40-50 минут</p>
              </div>
            </div>
          </div>
        </div>

        {/* Секция 3: Минимальная сумма */}
        <div className={styles.section}>
          <h2>💰 Минимальная сумма заказа</h2>
          <div className={styles.infoBox}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Минимальный заказ</span>
              <span className={styles.infoValue}>500 ₽</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Бесплатная доставка</span>
              <span className={styles.infoValue}>от {settings?.deliveryMinSum || 1000} ₽</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Стоимость доставки</span>
              <span className={styles.infoValue}>{settings?.deliveryPrice || 150} ₽</span>
            </div>
          </div>
        </div>

        {/* Секция 4: Часто задаваемые вопросы */}
        <div className={styles.section}>
          <h2>❓ Часто задаваемые вопросы</h2>
          <div className={styles.faq}>
            <div className={styles.faqItem}>
              <h3>Как оформить заказ на доставку?</h3>
              <p>Выберите блюда в меню, добавьте в корзину, выберите "Доставка" при оформлении и укажите адрес.</p>
            </div>
            <div className={styles.faqItem}>
              <h3>Можно ли изменить заказ после оформления?</h3>
              <p>Позвоните нам по телефону {settings?.phone || '+7 (988) 293-89-07'} до начала приготовления, и мы внесем изменения.</p>
            </div>
            <div className={styles.faqItem}>
              <h3>Как оплатить доставку?</h3>
              <p>Наличными курьеру, картой курьеру или онлайн при оформлении заказа.</p>
            </div>
            <div className={styles.faqItem}>
              <h3>Что если опоздание?</h3>
              <p>Мы всегда стараемся приезжать вовремя. В случае задержки мы предупредим вас по телефону.</p>
            </div>
          </div>
        </div>

        {/* Секция 5: Связь */}
        <div className={styles.section}>
          <h2>📞 Свяжитесь с нами</h2>
          <div className={styles.contactCard}>
            <div className={styles.contactItem}>
              <Phone size={20} />
              <div>
                <strong>Телефон</strong>
                <a href={`tel:${settings?.phone || '+79882938907'}`}>
                  {settings?.phone || '+7 (988) 293-89-07'}
                </a>
              </div>
            </div>
            <div className={styles.contactItem}>
              <Clock size={20} />
              <div>
                <strong>Режим работы</strong>
                <span>Ежедневно {getTodayHours()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}