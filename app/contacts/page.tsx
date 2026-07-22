'use client';

import { useEffect, useRef, useState } from 'react';
import { Phone, MapPin, Clock, Mail, Navigation, Star } from 'lucide-react';
import { MessageSquare } from 'lucide-react';
import styles from './page.module.scss';

declare global {
  interface Window {
    ymaps: any;
  }
}

export default function ContactsPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const restaurantCoords = [42.980263, 47.478083];
  const organizationId = '1249041015';

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=48bd9c64-8cf1-4345-b490-89daf1e3f5c8&lang=ru_RU`;
    script.async = true;
    script.onload = () => {
      window.ymaps.ready(initMap);
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const initMap = () => {
    if (!mapRef.current) return;

    const map = new window.ymaps.Map(mapRef.current, {
      center: restaurantCoords,
      zoom: 17,
      controls: ['zoomControl', 'fullscreenControl', 'routeButtonControl']
    });

    const placemark = new window.ymaps.Placemark(restaurantCoords, {
      hintContent: 'Челентано',
      balloonContentHeader: '<strong style="font-size:16px;">🍖 Челентано</strong>',
      balloonContentBody: `
        <div style="margin: 8px 0;">
          <div>⭐ Ресторан Челентано</div>
          <div style="color:#666; margin: 4px 0;">Средний чек: от 1000 ₽</div>
          <hr style="margin: 8px 0;">
          <div>📍 ул. Агасиева, 5А, Махачкала</div>
          <div>📞 +7 (988) 293-89-07</div>
          <div>🕐 11:00 - 23:00 (пт-вс до 01:00)</div>
        </div>
      `,
      balloonContentFooter: `
        <div style="margin-top: 8px;">
          <a href="https://yandex.ru/maps/org/1249041015" target="_blank" style="color:#c4492c;">Подробнее на Яндекс.Картах →</a>
        </div>
      `
    }, {
      preset: 'islands#redFoodIcon',
      balloonOffset: [0, -30],
      iconColor: '#c4492c'
    });

    map.geoObjects.add(placemark);
    placemark.balloon.open();
    setMapLoaded(true);
  };

  const openYandexMaps = () => {
    window.open('https://yandex.ru/maps/org/1249041015', '_blank');
  };

  const openRoutes = () => {
    window.open(`https://yandex.ru/maps/?rtext=~${restaurantCoords[0]},${restaurantCoords[1]}`, '_blank');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Контакты</h1>
        <p className={styles.subtitle}>Как нас найти и связаться с нами</p>
      </div>

      <div className={styles.content}>
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <div className={styles.cardIcon}>
              <Phone size={24} />
            </div>
            <h3>Телефон</h3>
            <a href="tel:+79882913293" className={styles.phoneLink}>
                +7 (988) 291-32-93
            </a>
            <a href="tel:+79882938907" className={styles.phoneLink}>
              +7 (988) 293-89-07
            </a>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.cardIcon}>
              <MapPin size={24} />
            </div>
            <h3>Адрес</h3>
            <p>Республика Дагестан,</p>
            <p>г. Махачкала, ул. Агасиева, 5А</p>
            <button onClick={openRoutes} className={styles.routeBtn}>
              <Navigation size={16} />
              Построить маршрут
            </button>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.cardIcon}>
              <div className={styles.starsRow}>
                <Star size={20} fill="#f4b942" color="#f4b942" />
                <span style={{ fontWeight: 700 }}></span>
              </div>
            </div>
            <h3>Рейтинг</h3>
            <p>на Яндекс.Картах</p>
            <a href="https://yandex.ru/maps/org/1249041015" target="_blank" className={styles.reviewLink}>
              Читать отзывы →
            </a>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.cardIcon}>
              <MessageSquare size={24} />
            </div>
            <h3>Связь с нами</h3>
            
            <div className={styles.socialLinks}>
              <span className={`${styles.socialLink} ${styles.whatsapp}`}>
                +7 (988) 291-32-93
              </span>
              <span className={`${styles.socialLink} ${styles.instagram}`}>
                @celentano_meat_restaurant_
              </span>
            </div>
            
            <p className={styles.legalDisclaimer}>
              * Instagram принадлежит компании Meta, признанной экстремистской организацией и запрещенной на территории РФ.
            </p>
          </div>
        </div>

        <div className={styles.mapSection}>
          <div className={styles.mapHeader}>
            <div>
              <h3>Мы на карте</h3>
              <p>ул. Агасиева, 5А, Махачкала</p>
            </div>
            <button onClick={openYandexMaps} className={styles.openMapsBtn}>
              Открыть в Яндекс.Картах
            </button>
          </div>
          <div ref={mapRef} className={styles.map}>
            {!mapLoaded && (
              <div className={styles.mapLoader}>
                <div className={styles.spinner}></div>
                <p>Загрузка карты...</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.reviewWidget}>
          <div className={styles.reviewWidgetContent}>
            <div className={styles.reviewWidgetText}>
              <span className={styles.reviewWidgetIcon}>⭐</span>
              <div>
                <h4>Поделитесь впечатлениями</h4>
                <p>Ваш отзыв поможет нам стать лучше</p>
              </div>
            </div>
            <a 
              href="https://yandex.ru/maps/org/1249041015" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.reviewWidgetBtn}
            >
              Написать отзыв
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/>
                <path d="M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}