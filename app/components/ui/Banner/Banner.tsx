'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar, Clock, Sparkles, Flame, Star, Gift, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || banners.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
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
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
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
      <div className={styles.container}>
        <div className={styles.slider}>
          <AnimatePresence mode="wait">
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6 }}
              className={styles.slide}
              style={{ backgroundImage: `url(${banner.imageUrl})` }}
            >
              <div className={styles.overlay}>
                <div className={styles.content}>
                  <div className={styles.badge} style={{ background: badge.bg, color: badge.color }}>
                    <BadgeIcon size={14} />
                    {badge.label}
                  </div>
                  <h2 className={styles.title}>{banner.title}</h2>
                  {banner.subtitle && (
                    <p className={styles.subtitle}>{banner.subtitle}</p>
                  )}
                  {banner.description && (
                    <p className={styles.description}>{banner.description}</p>
                  )}
                  {banner.link && banner.linkText && (
                    <Link href={banner.link} className={styles.button}>
                      {banner.linkText}
                      <ChevronRight size={16} />
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {banners.length > 1 && (
            <>
              <button onClick={prevSlide} className={`${styles.navBtn} ${styles.prevBtn}`}>
                <ChevronLeft size={24} />
              </button>
              <button onClick={nextSlide} className={`${styles.navBtn} ${styles.nextBtn}`}>
                <ChevronRight size={24} />
              </button>

              <div className={styles.dots}>
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentIndex(index);
                      setIsAutoPlaying(false);
                      setTimeout(() => setIsAutoPlaying(true), 8000);
                    }}
                    className={`${styles.dot} ${currentIndex === index ? styles.active : ''}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}