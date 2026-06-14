'use client';

import { useState, useEffect } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Reviews.module.scss';

const reviews = [
  {
    id: 1,
    name: 'Айшат Эфендиева',
    text: 'Очень вкусный шашлык, чуду, хлеб собственного приготовления. Баранью голову впервые попробовала - необыкновенно вкусно, сначала было страшно. Очень рекомендую 👍',
    rating: 5,
    date: '13 мая 2024'
  },
  {
    id: 2,
    name: 'Alena B.',
    text: 'Пока коротковато напишу. Удобное расположение, меню понятное. Все зависит от повара еще. В пределах разумного. Чисто, опрятно. Атмосферно',
    rating: 5,
    date: '16 апреля 2024'
  },
  {
    id: 3,
    name: 'Анна Седраковна',
    text: 'Прекрасный ресторан с замечательным персоналом и кухней! Рекомендую!',
    rating: 5,
    date: '2 апреля 2024'
  },
  {
    id: 4,
    name: 'Нариман Курбанов',
    text: 'Шашлык смак',
    rating: 5,
    date: '25 февраля 2024'
  }
];

export default function Reviews() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextReview = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevReview = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <section className={styles.reviews}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionBadge}>
            <Quote size={14} />
            Отзывы гостей
          </div>
          <h2 className={styles.title}>Что говорят о нас</h2>
          <div className={styles.ratingSummary}>
            <div className={styles.ratingStars}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} fill="#f4b942" color="#f4b942" />
              ))}
            </div>
            <span className={styles.ratingValue}>{averageRating.toFixed(1)}</span>
            <span className={styles.reviewCount}>• {reviews.length} отзывов</span>
          </div>
        </div>

        <div className={styles.sliderContainer}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className={styles.reviewCard}
            >
              <div className={styles.quoteIcon}>“</div>
              <p className={styles.reviewText}>{reviews[currentIndex].text}</p>
              <div className={styles.reviewAuthor}>
                <div className={styles.authorAvatar}>
                  {reviews[currentIndex].name[0]}
                </div>
                <div>
                  <div className={styles.authorName}>{reviews[currentIndex].name}</div>
                  <div className={styles.reviewDate}>{reviews[currentIndex].date}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <button onClick={prevReview} className={`${styles.navBtn} ${styles.prevBtn}`}>
            <ChevronLeft size={24} />
          </button>
          <button onClick={nextReview} className={`${styles.navBtn} ${styles.nextBtn}`}>
            <ChevronRight size={24} />
          </button>
        </div>

        <div className={styles.dots}>
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`${styles.dot} ${currentIndex === index ? styles.active : ''}`}
            />
          ))}
        </div>

        <div className={styles.allReviews}>
          <a href="/reviews" className={styles.allReviewsLink}>
            Все отзывы →
          </a>
        </div>
      </div>
    </section>
  );
}