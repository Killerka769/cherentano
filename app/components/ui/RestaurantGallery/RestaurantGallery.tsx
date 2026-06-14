'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Sparkles, Heart, Users, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './RestaurantGallery.module.scss';

const images = [
  {
    url: 'https://avatars.mds.yandex.net/get-altay/13220782/2a000001902b01698cd4cc0ae4b91a3ddeb4/XXXL',
    title: 'Уютный зал ресторана',
    description: 'Атмосфера тепла и гостеприимства'
  },
  {
    url: 'https://avatars.mds.yandex.net/get-altay/248099/2a00000160885ff40318c6612a49839845da/XXXL',
    title: 'Интерьер ресторана',
    description: 'Современный дизайн с национальным колоритом'
  },
  {
    url: 'https://avatars.mds.yandex.net/get-maps-adv-crm/3888992/2a0000017e9c663325b200419071fc28997a/landing_background_x2',
    title: 'Наша кухня',
    description: 'Шедевры дагестанской и европейской кухни'
  }
];

export default function RestaurantGallery() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAutoPlaying && !isHovered) {
      intervalRef.current = setInterval(() => {
        nextSlide();
      }, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAutoPlaying, isHovered, currentIndex]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  return (
    <section className={styles.gallery}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className={styles.sectionBadge}
          >
            <Sparkles size={14} />
            Виртуальный тур
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className={styles.title}
          >
            Атмосфера ресторана
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className={styles.subtitle}
          >
            Окунитесь в уютную атмосферу нашего ресторана
          </motion.p>
        </div>

        <div 
          className={styles.sliderContainer}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
              className={styles.slide}
            >
              <div className={styles.imageWrapper}>
                <img
                  src={images[currentIndex].url}
                  alt={images[currentIndex].title}
                  className={styles.image}
                />
                <div className={styles.imageOverlay}>
                  <div className={styles.imageContent}>
                    <h3>{images[currentIndex].title}</h3>
                    <p>{images[currentIndex].description}</p>
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

          {/* Автовоспроизведение */}
          <button onClick={toggleAutoPlay} className={styles.playBtn}>
            {isAutoPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>

        {/* Индикаторы */}
        <div className={styles.dots}>
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`${styles.dot} ${currentIndex === index ? styles.active : ''}`}
            />
          ))}
        </div>

        {/* Статистика */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <Users size={24} />
            <div>
              <span className={styles.statNumber}>5000+</span>
              <span className={styles.statLabel}>Довольных гостей</span>
            </div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <Heart size={24} />
            <div>
              <span className={styles.statNumber}>97%</span>
              <span className={styles.statLabel}>Положительных отзывов</span>
            </div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <Award size={24} />
            <div>
              <span className={styles.statNumber}>10+</span>
              <span className={styles.statLabel}>Лет на рынке</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}