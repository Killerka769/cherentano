'use client';

import { useState, useEffect } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, MessageCircle, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import styles from './Reviews.module.scss';

interface Review {
  id: number;
  authorName: string;
  text: string;
  rating: number;
  createdAt: string;
  reply?: string | null;
  isApproved?: boolean;
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || reviews.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, reviews.length]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      
      // Берём только одобренные, сортируем по дате (новые сверху)
      // и берём только последние 5
      const approvedReviews = (data.reviews || [])
        .filter((r: Review) => r.isApproved !== false)
        .sort((a: Review, b: Review) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5); // ✅ БЕРЁМ ТОЛЬКО 5
  
      setReviews(approvedReviews);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextReview = () => {
    if (reviews.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevReview = () => {
    if (reviews.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  const goToReview = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  // Состояния загрузки и пустого списка
  if (isLoading) {
    return (
      <section className={styles.reviews}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <Quote size={14} />
              Отзывы гостей
            </div>
            <h2 className={styles.title}>Что говорят о нас</h2>
          </div>
          <div className={styles.loaderContainer}>
            <div className={styles.spinner}></div>
            <p>Загрузка отзывов...</p>
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section className={styles.reviews}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <Quote size={14} />
              Отзывы гостей
            </div>
            <h2 className={styles.title}>Что говорят о нас</h2>
          </div>
          <div className={styles.emptyState}>
            <MessageCircle size={48} strokeWidth={1} />
            <h3>Пока нет отзывов</h3>
            <p>Будьте первым, кто оставит отзыв!</p>
            <Link href="/reviews" className={styles.writeReviewLink}>
              Написать отзыв →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const currentReview = reviews[currentIndex];

  return (
    <section className={styles.reviews}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionBadge}>
            <Quote size={14} />
            Отзывы гостей
          </div>
          <h2 className={styles.title}>Что говорят о нас</h2>
        </div>

        <div className={styles.sliderContainer}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className={styles.reviewCard}
            >
              <div className={styles.quoteIcon}>“</div>
              
              {/* Звёзды в карточке */}
              <div className={styles.cardStars}>
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={16} 
                    fill={i < currentReview.rating ? "#f4b942" : "#e0e0e0"} 
                    color={i < currentReview.rating ? "#f4b942" : "#e0e0e0"} 
                  />
                ))}
              </div>

              <p className={styles.reviewText}>{currentReview.text}</p>

              {currentReview.reply && (
                <div className={styles.replyBlock}>
                  <div className={styles.replyHeader}>
                    <Heart size={14} className={styles.replyHeart} />
                    <span>Ответ администрации</span>
                  </div>
                  <p className={styles.replyText}>{currentReview.reply}</p>
                </div>
              )}

              <div className={styles.reviewAuthor}>
                <div className={styles.authorAvatar}>
                  {currentReview.authorName[0]?.toUpperCase() || 'Г'}
                </div>
                <div>
                  <div className={styles.authorName}>{currentReview.authorName}</div>
                  <div className={styles.reviewDate}>
                    {new Date(currentReview.createdAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              {/* Индикатор прогресса */}
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${((currentIndex + 1) / reviews.length) * 100}%` }}
                />
              </div>
            </motion.div>
          </AnimatePresence>

          {reviews.length > 1 && (
            <>
              <button onClick={prevReview} className={`${styles.navBtn} ${styles.prevBtn}`}>
                <ChevronLeft size={24} />
              </button>
              <button onClick={nextReview} className={`${styles.navBtn} ${styles.nextBtn}`}>
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>

        {/* Точки пагинации */}
        {reviews.length > 1 && (
          <div className={styles.dots}>
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => goToReview(index)}
                className={`${styles.dot} ${currentIndex === index ? styles.active : ''}`}
                aria-label={`Отзыв ${index + 1}`}
              />
            ))}
          </div>
        )}

        <div className={styles.allReviews}>
          <Link href="/reviews" className={styles.writeReviewLink}>
            <MessageCircle size={16} />
            Все отзывы →
          </Link>
        </div>
      </div>
    </section>
  );
}