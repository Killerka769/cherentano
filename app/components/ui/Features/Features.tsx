'use client';

import { Truck, Beer, Wifi, CreditCard, Coffee, Pizza, Sparkles, Award, Croissant } from 'lucide-react';
import styles from './Features.module.scss';

const features = [
  {
    icon: Pizza,
    title: 'Дагестанская кухня',
    description: 'Традиционные блюда по старинным рецептам',
    color: '#e3f2fd',
    iconColor: '#2196f3'
  },
  {
    icon: Coffee,
    title: 'Европейская кухня',
    description: 'Пицца, паста, стейки и салаты',
    color: '#e8f5e9',
    iconColor: '#4caf50'
  },
  {
    icon: Truck,
    title: 'Бесплатная доставка',
    description: 'При заказе от 1000 ₽ в пределах города',
    color: '#fff3e0',
    iconColor: '#ff9800'
  },
  {
    icon: Croissant,
    title: 'Своя выпечка',
    description: 'Хлеб, лепёшки и десерты собственного производства',
    color: '#f3e5f5',
    iconColor: '#9c27b0'
  },
  {
    icon: Wifi,
    title: 'Бесплатный Wi-Fi',
    description: 'Оставайтесь на связи в нашем ресторане',
    color: '#e0f7fa',
    iconColor: '#00bcd4'
  },
  {
    icon: CreditCard,
    title: 'Оплата картой',
    description: 'Принимаем все виды банковских карт',
    color: '#fce4ec',
    iconColor: '#e91e63'
  }
];

export default function Features() {
  return (
    <section className={styles.features}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionBadge}>
            <Sparkles size={14} />
            Почему выбирают нас
          </div>
          <h2 className={styles.title}>Наши преимущества</h2>
          <p className={styles.subtitle}>Заботимся о каждом госте</p>
        </div>

        <div className={styles.grid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.icon} style={{ background: feature.color, color: feature.iconColor }}>
                <feature.icon size={32} />
              </div>
              <h3 className={styles.cardTitle}>{feature.title}</h3>
              <p className={styles.cardDesc}>{feature.description}</p>
            </div>
          ))}
        </div>

        <div className={styles.trustBadge}>
          <Award size={20} />
          <span>Более 5000 довольных гостей</span>
        </div>
      </div>
    </section>
  );
}