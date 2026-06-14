'use client';

import { useState, useEffect } from 'react';
import { Star, Star as StarOutline, MessageCircle, LogIn, Edit2, Trash2, X } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface Review {
  id: number;
  authorName: string;
  text: string;
  rating: number;
  reply: string | null;
  replyDate: string | null;
  createdAt: string;
  userId: string | null;
  isApproved: boolean;
  user?: {
    id: string;
    name: string;
    role: string;
  };
}

export default function ReviewsPage() {
  const { user, loading } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [newReview, setNewReview] = useState({
    text: '',
    rating: 5
  });
  const [editReview, setEditReview] = useState({
    text: '',
    rating: 5
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    if (user) {
      checkUserReview();
      checkCanReview();
    }
  }, [user]);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserReview = async () => {
    try {
      const res = await fetch('/api/user/has-reviewed');
      const data = await res.json();
      setHasReviewed(data.hasReviewed);
      if (data.review) {
        setMyReview(data.review);
      }
    } catch (error) {
      console.error('Failed to check user review:', error);
    }
  };

  const checkCanReview = async () => {
    try {
      const res = await fetch('/api/user/can-review');
      const data = await res.json();
      setCanReview(data.canReview);
    } catch (error) {
      console.error('Failed to check can review:', error);
    }
  };

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Войдите в аккаунт, чтобы оставить отзыв');
      return;
    }
    
    if (!canReview) {
      toast.error('Оставить отзыв можно только после получения заказа');
      return;
    }
    
    if (!newReview.text) {
      toast.error('Напишите текст отзыва');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newReview.text,
          rating: newReview.rating
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка отправки');
      }
      
      toast.success('Спасибо за отзыв! Он будет опубликован после модерации.');
      setNewReview({ text: '', rating: 5 });
      setShowForm(false);
      setHasReviewed(true);
      fetchReviews();
      checkUserReview();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (review: Review) => {
    setEditReview({
      text: review.text,
      rating: review.rating
    });
    setEditingReview(review);
  };

  const handleUpdateReview = async () => {
    if (!editingReview) return;
    
    if (!editReview.text) {
      toast.error('Напишите текст отзыва');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: editingReview.id,
          text: editReview.text,
          rating: editReview.rating
        })
      });
      
      if (res.ok) {
        toast.success('Отзыв обновлен и отправлен на модерацию');
        setEditingReview(null);
        fetchReviews();
        checkUserReview();
      } else {
        const error = await res.json();
        toast.error(error.error);
      }
    } catch (error) {
      toast.error('Ошибка');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!editingReview) return;
    if (!confirm('Удалить отзыв? Это действие нельзя отменить.')) return;
    
    try {
      const res = await fetch(`/api/reviews?id=${editingReview.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Отзыв удален');
        setEditingReview(null);
        setMyReview(null);
        setHasReviewed(false);
        fetchReviews();
        checkUserReview();
      } else {
        toast.error('Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const renderStars = (rating: number, interactive = false, onStarClick?: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => interactive && onStarClick?.(i + 1)}
        className={interactive ? styles.interactiveStar : ''}
        disabled={!interactive}
      >
        <Star 
          size={interactive ? 28 : 16} 
          fill={i < rating ? "#f4b942" : "none"} 
          color="#f4b942" 
          strokeWidth={i < rating ? 0 : 1}
        />
      </button>
    ));
  };

  // ✅ ИСПРАВЛЕНО: теперь любой авторизованный пользователь может перейти в профиль
  const canViewProfile = (reviewUserId: string | null) => {
    // Если нет userId - нельзя
    if (!reviewUserId) return false;
    // Если пользователь не авторизован - нельзя
    if (!user) return false;
    // В остальных случаях - можно (любой авторизованный)
    return true;
  };

  if (loading || isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Загрузка отзывов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Отзывы</h1>
        <p className={styles.subtitle}>Что говорят наши гости</p>
      </div>

      <div className={styles.statsCard}>
        <div className={styles.ratingBig}>
          <div className={styles.ratingValue}>{averageRating.toFixed(1)}</div>
          <div className={styles.starsBig}>{renderStars(Math.round(averageRating))}</div>
          <div className={styles.reviewCount}>{reviews.length} {reviews.length === 1 ? 'отзыв' : reviews.length < 5 ? 'отзыва' : 'отзывов'}</div>
        </div>
        
        {!user && (
          <Link href="/login" className={styles.loginBtn}>
            <LogIn size={18} />
            Войдите, чтобы оставить отзыв
          </Link>
        )}
        
        {user && !hasReviewed && canReview && (
          <button onClick={() => setShowForm(!showForm)} className={styles.writeBtn}>
            <MessageCircle size={18} />
            Написать отзыв
          </button>
        )}
        
        {user && !canReview && !hasReviewed && (
          <div className={styles.cannotReview}>
            <MessageCircle size={18} />
            Оставить отзыв можно только после получения заказа
          </div>
        )}
      </div>

      {/* Форма нового отзыва */}
      {showForm && (
        <form onSubmit={handleSubmitReview} className={styles.reviewForm}>
          <h3>Оставьте свой отзыв</h3>
          
          <div className={styles.formGroup}>
            <label>Ваша оценка</label>
            <div className={styles.formRating}>
              {renderStars(newReview.rating, true, (rating) => setNewReview({ ...newReview, rating }))}
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label>Ваш отзыв</label>
            <textarea
              placeholder="Поделитесь впечатлениями о ресторане, блюдах, обслуживании..."
              rows={4}
              maxLength={500}
              value={newReview.text}
              onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
              required
            />
            <div className={styles.charCounter}>{newReview.text.length}/500</div>
          </div>
          
          <div className={styles.formButtons}>
            <button type="submit" disabled={isSubmitting} className={styles.submitReviewBtn}>
              {isSubmitting ? 'Отправка...' : 'Отправить отзыв'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className={styles.cancelBtn}>
              Отмена
            </button>
          </div>
        </form>
      )}

      {/* Список отзывов */}
      <div className={styles.reviewsList}>
        {reviews.length === 0 ? (
          <div className={styles.empty}>
            <MessageCircle size={48} />
            <p>Пока нет отзывов</p>
            <span>Будьте первым, кто оставит отзыв!</span>
          </div>
        ) : (
          reviews.map(review => {
            // ✅ ИСПРАВЛЕНО: ссылка на профиль для всех авторизованных
            const showProfileLink = user && review.userId;
            
            return (
              <div key={review.id} className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <div className={styles.reviewHeaderLeft}>
                    {showProfileLink ? (
                      <Link href={`/profile/${review.userId}`} className={styles.authorLink}>
                        <strong>{review.authorName}</strong>
                      </Link>
                    ) : (
                      <strong>{review.authorName}</strong>
                    )}
                    <div className={styles.reviewStars}>{renderStars(review.rating)}</div>
                    {!review.isApproved && review.userId === user?.id && (
                      <span className={styles.pendingBadge}>На модерации</span>
                    )}
                  </div>
                  <div className={styles.reviewHeaderRight}>
                    <div className={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                    {review.userId === user?.id && (
                      <button 
                        onClick={() => openEditModal(review)} 
                        className={styles.editReviewBtn}
                        title="Редактировать отзыв"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <p className={styles.reviewText}>{review.text}</p>
                
                {/* Ответ от ресторана */}
                {review.reply && (
                  <div className={styles.replySection}>
                    <div className={styles.replyContent}>
                      <div className={styles.replyHeader}>
                        <strong>Администрация ресторана Челентано</strong>
                        <span>{review.replyDate ? new Date(review.replyDate).toLocaleDateString('ru-RU') : ''}</span>
                      </div>
                      <p>{review.reply}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Модальное окно редактирования отзыва */}
      {editingReview && (
        <div className={styles.editModal}>
          <div className={styles.editModalContent}>
            <div className={styles.editModalHeader}>
              <h3>Редактировать отзыв</h3>
              <button onClick={() => setEditingReview(null)} className={styles.closeModalBtn}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.formGroup}>
              <label>Ваша оценка</label>
              <div className={styles.formRating}>
                {renderStars(editReview.rating, true, (rating) => setEditReview({ ...editReview, rating }))}
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label>Ваш отзыв</label>
              <textarea
                placeholder="Поделитесь впечатлениями..."
                rows={4}
                maxLength={500}
                value={editReview.text}
                onChange={(e) => setEditReview({ ...editReview, text: e.target.value })}
                required
              />
              <div className={styles.charCounter}>{editReview.text.length}/500</div>
            </div>
            
            <div className={styles.editModalButtons}>
              <button onClick={handleUpdateReview} disabled={isSubmitting} className={styles.saveEditBtn}>
                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button onClick={handleDeleteReview} className={styles.deleteReviewBtn}>
                <Trash2 size={16} />
                Удалить отзыв
              </button>
            </div>
            <p className={styles.editNote}>После редактирования отзыв снова отправится на модерацию</p>
          </div>
        </div>
      )}
    </div>
  );
}