'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ChefHat, 
  Clock, 
  UtensilsCrossed,
  GlassWater,
  Flame,
  Star,
  Users,
  Award,
  HeartHandshake,
  Sparkles
} from 'lucide-react';
import styles from './Hero.module.scss';

const slides = [
  {
    image: 'uploads/media/hero/block1.webp',
    title: 'Мясной ресторан Celentano',
    subtitle: 'Сочные стейки, блюда на живом огне и кавказское гостеприимство в самом сердце Махачкалы.',
    highlight: 'Традиции и вкус',
    tag: '🔥 Хиты сезона'
  },
  {
    image: 'uploads/media/hero/block2.webp',
    title: 'Европейский шик',
    subtitle: 'Классические шедевры европейской кухни, авторские кулинарные тренды и изысканная барная карта.',
    highlight: 'Изысканный ужин',
    tag: '⭐ Премиум класс'
  },
  {
    image: 'uploads/media/hero/block4.jpg',
    title: '10 уютных кабинок',
    subtitle: 'Отдельные приватные кабинки, караоке и банкетные зоны. Идеальное пространство для любого события.',
    highlight: 'Идеальный отдых',
    tag: '📅 Бронируйте сейчас'
  }
];

const advantages = [
  { icon: <UtensilsCrossed size={20} />, text: 'Авторская кухня' },
  { icon: <Sparkles size={20} />, text: 'Премиум сервис' },
  { icon: <Flame size={20} />, text: 'Живой огонь' },
  { icon: <Users size={20} />, text: 'Приватные залы' },
];

export default function Hero() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

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
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const handleMenuClick = () => router.push('/menu');
  const handleBookingClick = () => router.push('/booking');
  const handleDeliveryClick = () => router.push('/delivery');

  return (
    <section className={styles.hero}>
      {/* Фоновые эффекты */}
      <div className={styles.bgEffects}>
        <div className={styles.bgBlur1} />
        <div className={styles.bgBlur2} />
        <div className={styles.bgBlur3} />
        <div className={styles.bgGrid} />
      </div>

      {/* Плавающие иконки */}
      <div className={styles.floatingIcons}>
        <motion.span 
          className={styles.floatingIcon}
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, delay: 0 }}
        >🍖</motion.span>
        <motion.span 
          className={styles.floatingIcon}
          animate={{ y: [0, -25, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, delay: 1 }}
        >🥘</motion.span>
        <motion.span 
          className={styles.floatingIcon}
          animate={{ y: [0, -18, 0], rotate: [0, 15, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 2 }}
        >🍷</motion.span>
        <motion.span 
          className={styles.floatingIcon}
          animate={{ y: [0, -22, 0], rotate: [0, -8, 0] }}
          transition={{ duration: 8, repeat: Infinity, delay: 3 }}
        >🧀</motion.span>
        <motion.span 
          className={styles.floatingIcon}
          animate={{ y: [0, -15, 0], rotate: [0, 12, 0] }}
          transition={{ duration: 6, repeat: Infinity, delay: 4 }}
        >🌿</motion.span>
      </div>

      {/* Слайдер */}
      <div className={styles.sliderContainer}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={styles.slide}
            style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
          >
            <div className={styles.slideOverlay}>
              <div className={styles.container}>
                <div className={styles.content}>
                  {/* Тег */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className={styles.tag}
                  >
                    <span className={styles.tagPulse} />
                    {slides[currentSlide].tag}
                  </motion.div>

                  {/* Заголовок */}
                  <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className={styles.title}
                  >
                    {slides[currentSlide].title}
                    <span className={styles.titleAccent}>.</span>
                  </motion.h1>

                  {/* Подзаголовок */}
                  <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className={styles.subtitle}
                  >
                    {slides[currentSlide].subtitle}
                  </motion.p>

                  {/* Хайлайт */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className={styles.highlight}
                  >
                    <span className={styles.highlightIcon}>✦</span>
                    {slides[currentSlide].highlight}
                  </motion.div>

                  {/* Кнопки */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className={styles.buttons}
                  >
                    <button onClick={handleMenuClick} className={styles.primaryBtn}>
                      Смотреть меню
                      <ArrowRight size={20} />
                    </button>
                    <button onClick={handleBookingClick} className={styles.outlineBtn}>
                      Забронировать
                    </button>
                    <button onClick={handleDeliveryClick} className={styles.deliveryBtn}>
                      Доставка
                    </button>
                  </motion.div>

                  {/* Преимущества */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    className={styles.advantages}
                  >
                    {advantages.map((item, index) => (
                      <div key={index} className={styles.advantageItem}>
                        <span className={styles.advantageIcon}>{item.icon}</span>
                        <span className={styles.advantageText}>{item.text}</span>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Кнопки навигации */}
        <button onClick={prevSlide} className={`${styles.navBtn} ${styles.prevBtn}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <button onClick={nextSlide} className={`${styles.navBtn} ${styles.nextBtn}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>

        {/* Индикаторы */}
        <div className={styles.dots}>
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`${styles.dot} ${currentSlide === index ? styles.active : ''}`}
              aria-label={`Слайд ${index + 1}`}
            />
          ))}
        </div>

        {/* Счётчик слайдов
        <div className={styles.slideCounter}>
          <span className={styles.counterCurrent}>{String(currentSlide + 1).padStart(2, '0')}</span>
          <span className={styles.counterSeparator}>/</span>
          <span className={styles.counterTotal}>{String(slides.length).padStart(2, '0')}</span>
        </div> */}
      </div>
    </section>
  );
}