'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Star, Trash2, Reply, Send, X, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface Review {
  id: number;
  authorName: string;
  text: string;
  rating: number;
  reply: string | null;
  replyDate: string | null;
  isApproved: boolean;
  createdAt: string;
  userId: string | null;
}

export default function AdminReviewsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [editingReply, setEditingReply] = useState<{ id: number; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchReviews();
    }
  }, [user, filter]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/admin/reviews?status=${filter}`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const approveReview = async (id: number) => {
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: id, action: 'approve' })
      });
      
      if (res.ok) {
        toast.success('Отзыв одобрен');
        fetchReviews();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const deleteReview = async (id: number) => {
    if (!confirm('Удалить отзыв?')) return;
    
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: id })
      });
      
      if (res.ok) {
        toast.success('Отзыв удален');
        fetchReviews();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const handleAddReply = async (reviewId: number) => {
    if (!replyText.trim()) {
      toast.error('Введите текст ответа');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/admin/reviews/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, reply: replyText })
      });
      
      if (res.ok) {
        toast.success('Ответ добавлен');
        setReplyText('');
        setReplyingTo(null);
        fetchReviews();
      } else {
        toast.error('Ошибка');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditReply = async (reviewId: number) => {
    if (!editingReply?.text.trim()) {
      toast.error('Введите текст ответа');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/admin/reviews/reply', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, reply: editingReply.text })
      });
      
      if (res.ok) {
        toast.success('Ответ обновлен');
        setEditingReply(null);
        fetchReviews();
      } else {
        toast.error('Ошибка');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReply = async (reviewId: number) => {
    if (!confirm('Удалить ответ?')) return;
    
    try {
      const res = await fetch(`/api/admin/reviews/reply?reviewId=${reviewId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Ответ удален');
        fetchReviews();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={14} fill={i < rating ? "#f4b942" : "none"} color="#f4b942" strokeWidth={i < rating ? 0 : 1} />
    ));
  };

  if (loading || isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Модерация отзывов</h1>
      </div>

      <div className={styles.filters}>
        <button onClick={() => setFilter('pending')} className={`${styles.filterBtn} ${filter === 'pending' ? styles.active : ''}`}>
          ⏳ На модерации ({reviews.filter(r => !r.isApproved).length})
        </button>
        <button onClick={() => setFilter('approved')} className={`${styles.filterBtn} ${filter === 'approved' ? styles.active : ''}`}>
          ✅ Одобренные ({reviews.filter(r => r.isApproved).length})
        </button>
      </div>

      <div className={styles.reviewsList}>
        {reviews.length === 0 ? (
          <div className={styles.empty}>Нет отзывов</div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.author}>
                  <strong>{review.authorName}</strong>
                  <div className={styles.rating}>
                    {renderStars(review.rating)}
                  </div>
                </div>
                <div className={styles.date}>
                  {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                </div>
              </div>
              
              <p className={styles.text}>{review.text}</p>
              
              {/* Ответ ресторана */}
              {review.reply && (
                <div className={styles.existingReply}>
                  <div className={styles.replyHeader}>
                    <Reply size={14} />
                    <strong>Ответ ресторана:</strong>
                    <span>{review.replyDate ? new Date(review.replyDate).toLocaleDateString('ru-RU') : ''}</span>
                    <button 
                      onClick={() => setEditingReply({ id: review.id, text: review.reply! })} 
                      className={styles.editReplyBtn}
                      title="Редактировать ответ"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={() => handleDeleteReply(review.id)} 
                      className={styles.deleteReplyBtn}
                      title="Удалить ответ"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {editingReply?.id === review.id ? (
                    <div className={styles.editReplyForm}>
                      <textarea
                        value={editingReply.text}
                        onChange={(e) => setEditingReply({ ...editingReply, text: e.target.value })}
                        rows={2}
                        autoFocus
                      />
                      <div className={styles.editReplyActions}>
                        <button onClick={() => handleEditReply(review.id)} disabled={isSubmitting}>
                          <Send size={14} />
                          Сохранить
                        </button>
                        <button onClick={() => setEditingReply(null)}>Отмена</button>
                      </div>
                    </div>
                  ) : (
                    <p>{review.reply}</p>
                  )}
                </div>
              )}
              
              <div className={styles.actions}>
                {!review.isApproved && (
                  <button onClick={() => approveReview(review.id)} className={styles.approveBtn}>
                    <CheckCircle size={16} /> Одобрить
                  </button>
                )}
                
                {review.isApproved && !review.reply && (
                  <button onClick={() => setReplyingTo(review.id)} className={styles.replyBtn}>
                    <Reply size={16} /> Ответить
                  </button>
                )}
                
                <button onClick={() => deleteReview(review.id)} className={styles.deleteBtn}>
                  <Trash2 size={16} /> Удалить
                </button>
              </div>
              
              {/* Форма добавления ответа */}
              {replyingTo === review.id && (
                <div className={styles.replyForm}>
                  <textarea
                    placeholder="Введите ответ на отзыв..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    autoFocus
                  />
                  <div className={styles.replyActions}>
                    <button onClick={() => handleAddReply(review.id)} disabled={isSubmitting} className={styles.submitReplyBtn}>
                      <Send size={14} />
                      {isSubmitting ? 'Отправка...' : 'Отправить'}
                    </button>
                    <button onClick={() => {
                      setReplyingTo(null);
                      setReplyText('');
                    }} className={styles.cancelReplyBtn}>
                      <X size={14} />
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}