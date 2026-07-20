'use client';

import Link from 'next/link';
import { Truck, Clock, MapPin, CreditCard, Phone, ArrowLeft, Car, AlertCircle } from 'lucide-react';
import styles from './page.module.scss';

interface Settings {
  phone: string;
  email: string;
  address: string;
  deliveryMinSum: number;
  deliveryPrice: number;
  workDays: any;
}

interface DeliveryClientProps {
  initialSettings: Settings | null;
}

export default function DeliveryClient({ initialSettings }: DeliveryClientProps) {
  const settings = initialSettings;

  const getTodayHours = () => {
    if (!settings?.workDays) return '11:00 - 23:00';
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const workDays = settings.workDays;
    
    return workDays[today] 
      ? `${workDays[today].open} - ${workDays[today].close}`
      : '11:00 - 23:00';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={18} />
          На главную
        </Link>
        <h1 className={styles.title}>🚚 Доставка еды</h1>
        <p className={styles.subtitle}>Быстрая доставка в Махачкале</p>
      </div>

      <div className={styles.content}>
        {/* Секция 1: Как мы доставляем */}
        <div className={styles.section}>
          <h2>Как мы доставляем</h2>
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.icon}>
                <Car size={32} />
              </div>
              <h3>Доставка такси</h3>
              <p>Заказ приезжает на такси — быстро и удобно</p>
            </div>
            <div className={styles.card}>
              <div className={styles.icon}>
                <Clock size={32} />
              </div>
              <h3>15-30 минут</h3>
              <p>Среднее время доставки по городу</p>
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
              <h3>Оплата на месте</h3>
              <p>Наличными или картой водителю такси</p>
            </div>
          </div>
        </div>

        {/* Секция 2: Важно! */}
        <div className={`${styles.section} ${styles.importantSection}`}>
          <div className={styles.importantBox}>
            <AlertCircle size={28} className={styles.importantIcon} />
            <div>
              <h3>Доставка за счёт клиента</h3>
              <p>
                Доставка осуществляется на такси. 
                <strong> Стоимость поездки оплачивается клиентом на месте — водителю такси.</strong>
              </p>
              <p className={styles.importantNote}>
                Стоимость зависит от расстояния и тарифов такси.
              </p>
            </div>
          </div>
        </div>

        {/* Секция 3: Часто задаваемые вопросы */}
        <div className={styles.section}>
          <h2>❓ Часто задаваемые вопросы</h2>
          <div className={styles.faq}>
            <div className={styles.faqItem}>
              <h3>Как оформить заказ на доставку?</h3>
              <p>Выберите блюда в меню, добавьте в корзину, выберите "Доставка" при оформлении и укажите адрес.</p>
            </div>
            <div className={styles.faqItem}>
              <h3>Сколько стоит доставка?</h3>
              <p>Доставка осуществляется на такси. Стоимость зависит от расстояния и тарифов такси. Оплата производится на месте водителю.</p>
            </div>
            <div className={styles.faqItem}>
              <h3>Как оплатить доставку?</h3>
              <p>Оплата производится на месте — водителю такси наличными или картой. Заказ оплачивается отдельно.</p>
            </div>
            <div className={styles.faqItem}>
              <h3>Можно ли изменить заказ после оформления?</h3>
              <p>Позвоните нам по телефону {settings?.phone || '+7 (988) 293-89-07'} до начала приготовления, и мы внесем изменения.</p>
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
                <a href={`tel:${settings?.phone || '+79882938907'}'}`}>
                  {settings?.phone || '+7 (988) 293-89-07'}
                </a>
              </div>
            </div>
            <div className={styles.contactItem}>
              <Clock size={20} />
              <div>
                <strong>Режим работы</strong>
                <span>{getTodayHours()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}