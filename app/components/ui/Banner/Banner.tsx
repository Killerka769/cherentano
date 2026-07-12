'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar, Sparkles, Flame, Star, Gift, Megaphone } from 'lucide-react';
import styles from './Banner.module.scss';

interface BannerItem {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string;
  link: string | null;
  linkText: string | null;
  type: 'PROMOTION' | 'EVENT' | 'RECOMMEND' | 'HOT' | 'NEW' | 'SPECIAL';
}

const BADGE_CONFIG = {
  PROMOTION: { label: 'Акция', icon: Gift, color: '#ff9800', bg: 'rgba(255,152,0,0.2)' },
  EVENT: { label: 'Событие', icon: Calendar, color: '#2196f3', bg: 'rgba(33,150,243,0.2)' },
  RECOMMEND: { label: 'Рекомендуем', icon: Star, color: '#4caf50', bg: 'rgba(76,175,80,0.2)' },
  HOT: { label: 'Горячее!', icon: Flame, color: '#f44336', bg: 'rgba(244,67,54,0.2)' },
  NEW: { label: 'Новинка', icon: Sparkles, color: '#9c27b0', bg: 'rgba(156,39,176,0.2)' },
  SPECIAL: { label: 'Спецпредложение', icon: Megaphone, color: '#e91e63', bg: 'rgba(233,30,99,0.2)' }
};

export default function Banner() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || banners.length === 0) return;
    const interval = setInterval(() => {
      setDirection('right');
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, banners.length]);

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/banners');
      const data = await res.json();
      setBanners(data.banners || []);
    } catch (error) {
      console.error('Failed to fetch banners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextSlide = () => {
    setDirection('right');
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 4000);
  };

  const prevSlide = () => {
    setDirection('left');
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 4000);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 'right' : 'left');
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 4000);
  };

  if (isLoading) {
    return <div className={styles.skeleton}></div>;
  }

  if (banners.length === 0) {
    return null;
  }

  const banner = banners[currentIndex];
  const badge = BADGE_CONFIG[banner.type] || BADGE_CONFIG.PROMOTION;
  const BadgeIcon = badge.icon;

  return (
    <section className={styles.banner}>
      <div className={styles.slider}>
        <div className={styles.sliderWrapper}>
          <div 
            className={styles.slideTrack}
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
              transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
          >
            {banners.map((item) => (
              <div 
                key={item.id}
                className={styles.slide}
                style={{ backgroundImage: `url(${item.imageUrl})` }}
              >
                <div className={styles.overlay}>
                  <div className={styles.content}>
                    <div className={styles.badge} style={{ background: badge.bg, color: badge.color }}>
                      <BadgeIcon size={14} />
                      {BADGE_CONFIG[item.type]?.label || 'Акция'}
                    </div>
                    <h2 className={styles.title}>{item.title}</h2>
                    {item.subtitle && (
                      <p className={styles.subtitle}>{item.subtitle}</p>
                    )}
                    {item.description && (
                      <p className={styles.description}>{item.description}</p>
                    )}
                    {item.link && item.linkText && (
                      <Link href={item.link} className={styles.button}>
                        {item.linkText}
                        <ChevronRight size={16} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {banners.length > 1 && (
          <>
            <button 
              onClick={prevSlide} 
              className={`${styles.navBtn} ${styles.prevBtn}`}
              aria-label="Предыдущий слайд"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={nextSlide} 
              className={`${styles.navBtn} ${styles.nextBtn}`}
              aria-label="Следующий слайд"
            >
              <ChevronRight size={24} />
            </button>

            <div className={styles.dots}>
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`${styles.dot} ${currentIndex === index ? styles.active : ''}`}
                  aria-label={`Перейти к слайду ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}