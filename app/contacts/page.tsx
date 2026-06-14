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
  // Координаты ресторана (точные с Яндекс.Карт)
  const restaurantCoords = [42.980263, 47.478083]; // ул. Агасиева, 5А
  const organizationId = '1249041015'; // ID организации на Яндекс.Картах

  useEffect(() => {
    // Загрузка скрипта Яндекс.Карт с вашим API ключом
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

    // Создание красивой метки с информацией о ресторане
    const placemark = new window.ymaps.Placemark(restaurantCoords, {
      hintContent: 'Челентано',
      balloonContentHeader: '<strong style="font-size:16px;">🍖 Челентано</strong>',
      balloonContentBody: `
        <div style="margin: 8px 0;">
          <div>⭐ 4.4 · Ресторан</div>
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
    
    // Открыть балун при загрузке
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
            <a href="tel:+7988293XXXX" className={styles.phoneLink}>
              +7 (988) 293-89-07
            </a>
            <p className={styles.smallNote}>Ежедневно с 11:00 до 23:00</p>
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
                <span style={{ fontWeight: 700, marginLeft: 4 }}>4.4</span>
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
            <h3>Мессенджеры</h3>
            <a href="https://wa.me/79882938907" className={styles.whatsappLink}>
              <MessageSquare size={18} />
              WhatsApp
            </a>
            <a href="https://t.me/cherentano_bot" className={styles.telegramLink}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.6-1.38-.97-2.23-1.56-.99-.69-.35-1.07.22-1.69.15-.15 2.78-2.55 2.83-2.77.01-.03.01-.12-.06-.17-.07-.05-.18-.03-.26-.02-.11.02-1.86 1.18-5.26 3.48-.5.34-.95.51-1.36.5-.45-.01-1.31-.25-1.95-.46-.84-.27-1.5-.42-1.44-.88.03-.24.27-.49.74-.75 2.96-1.29 4.94-2.14 5.94-2.55 2.83-1.16 3.42-1.36 3.81-1.37.08 0 .27.02.39.13.1.09.13.21.14.31-.01.13-.07.86-.13 1.47z"/>
              </svg>
              Telegram
            </a>
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

        <div className={styles.howToGet}>
          <h3>Как добраться</h3>
          <div className={styles.transportGrid}>
            <div className={styles.transportItem}>
              <strong>🚗 На автомобиле</strong>
              <p>Ориентир — пересечение улиц Агасиева и Даниялова. Рядом есть бесплатная парковка.</p>
            </div>
            <div className={styles.transportItem}>
              <strong>🚌 На общественном транспорте</strong>
              <p>Остановка "Улица Агасиева" — автобусы № 1, 5, 12, 15, маршрутки № 101, 102, 105.</p>
            </div>
            <div className={styles.transportItem}>
              <strong>🚶 Пешком</strong>
              <p>От проспекта Расула Гамзатова 7-10 минут пешком. Ресторан находится на первом этаже жилого дома.</p>
            </div>
          </div>
        </div>

        {/* Блок с реальным рейтингом с Яндекс.Карт */}
        <div className={styles.yandexWidget}>
          <div className={styles.widgetContent}>
            <div className={styles.widgetLeft}>
              <img src="/images/yandex-maps-logo.svg" alt="Яндекс.Карты" className={styles.yandexLogo} />
              <div className={styles.widgetRating}>
                <span className={styles.ratingNumber}>4.4</span>
                <div className={styles.ratingStars}>
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={16} fill={i <= 4 ? "#f4b942" : "#ddd"} color={i <= 4 ? "#f4b942" : "#ddd"} />
                  ))}
                </div>
                <span className={styles.reviewsCount}>97 отзывов</span>
              </div>
            </div>
            <a href="https://yandex.ru/maps/org/1249041015" target="_blank" className={styles.writeReviewBtn}>
              Написать отзыв
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}