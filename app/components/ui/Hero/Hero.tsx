'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ArrowRight, Play, ChefHat, Clock, Award, ChevronLeft, ChevronRight, Truck } from 'lucide-react';
import styles from './Hero.module.scss';

const slides = [
  {
    image: 'https://avatars.mds.yandex.net/get-altay/15366886/2a00000194c7fa1a3e6653df1d32f94274ba/XXXL',
    title: 'Уютная атмосфера',
    subtitle: 'Погрузитесь в мир вкуса и комфорта',
    highlight: 'Дагестанская кухня'
  },
  {
    image: 'https://avatars.mds.yandex.net/get-altay/248099/2a00000160885ff40318c6612a49839845da/XXXL',
    title: 'Авторские блюда',
    subtitle: 'Шедевры от наших шеф-поваров',
    highlight: 'Европейская кухня'
  },
  {
    image: 'https://avatars.mds.yandex.net/get-maps-adv-crm/3888992/2a0000017e9c663325b200419071fc28997a/landing_background_x2',
    title: 'Идеальный ужин',
    subtitle: 'Лучшее место для встреч и праздников',
    highlight: 'Премиум сервис'
  }
];

export default function Hero() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handleMenuClick = () => {
    router.push('/menu');
  };

  const handleBookingClick = () => {
    router.push('/booking');
  };

  return (
    <section className={styles.hero}>
      {/* Фоновые эффекты */}
      <div className={styles.bgEffects}>
        <div className={styles.bgBlur1}></div>
        <div className={styles.bgBlur2}></div>
        <div className={styles.bgBlur3}></div>
      </div>

      {/* Слайдер */}
      <div className={styles.sliderContainer}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.7 }}
            className={styles.slide}
            style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
          >
            <div className={styles.slideOverlay}>
              <div className={styles.container}>
                <div className={`${styles.content} ${isVisible ? styles.visible : ''}`}>
                  <div className={styles.badge}>
                    <ChefHat size={14} />
                    Премиум ресторан
                    <span className={styles.badgeDot}>●</span>
                    <span className={styles.badgeRating}>
                      <Star size={12} fill="#FFD700" stroke="#FFD700" />
                      4.4
                    </span>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
                    <h1 className={styles.title}>
                      {slides[currentSlide].title}
                    </h1>
                    <p className={styles.subtitle}>
                      {slides[currentSlide].subtitle}
                    </p>
                    <div className={styles.highlightTag}>
                      {slides[currentSlide].highlight}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className={styles.buttons}
                  >
                    <button onClick={handleMenuClick} className={styles.primaryBtn}>
                      Смотреть меню
                      <ArrowRight size={18} />
                    </button>
                    <button onClick={handleBookingClick} className={styles.outlineBtn}>
                      <Play size={18} />
                      Забронировать стол
                    </button>
                    <button onClick={() => router.push('/delivery')} className={styles.deliveryBtn}>
                      <Truck size={18} />
                      Доставка еды
                    </button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className={styles.stats}
                  >
                    <div className={styles.stat}>
                      <div className={styles.statIcon}>⭐</div>
                      <div>
                        <span className={styles.statValue}>4.4</span>
                        <span className={styles.statLabel}>Яндекс.Карты</span>
                      </div>
                    </div>
                    <div className={styles.statDivider}></div>
                    <div className={styles.stat}>
                      <div className={styles.statIcon}>💬</div>
                      <div>
                        <span className={styles.statValue}>97+</span>
                        <span className={styles.statLabel}>Отзывов</span>
                      </div>
                    </div>
                    <div className={styles.statDivider}></div>
                    <div className={styles.stat}>
                      <div className={styles.statIcon}>🍽️</div>
                      <div>
                        <span className={styles.statValue}>30+</span>
                        <span className={styles.statLabel}>Блюд</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Кнопки навигации */}
        <button onClick={prevSlide} className={`${styles.navBtn} ${styles.prevBtn}`}>
          <ChevronLeft size={24} />
        </button>
        <button onClick={nextSlide} className={`${styles.navBtn} ${styles.nextBtn}`}>
          <ChevronRight size={24} />
        </button>

        {/* Индикаторы слайдов */}
        <div className={styles.dots}>
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentSlide(index);
                setIsAutoPlaying(false);
                setTimeout(() => setIsAutoPlaying(true), 10000);
              }}
              className={`${styles.dot} ${currentSlide === index ? styles.active : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Плавающие элементы */}
      <div className={styles.floatingElements}>
        <div className={styles.floating1}>🍕</div>
        <div className={styles.floating2}>🥩</div>
        <div className={styles.floating3}>🍷</div>
        <div className={styles.floating4}>🥘</div>
      </div>
    </section>
  );
}