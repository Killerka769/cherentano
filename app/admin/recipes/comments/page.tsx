'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Trash2, Eye, MessageCircle, ChefHat, ArrowLeft, Reply, Send, X, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface Comment {
  id: string;
  authorName: string;
  authorEmail: string | null;
  content: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
  recipe: {
    id: string;
    title: string;
    slug: string;
  };
  user?: {
    id: string;
    name: string;
    role: string;
  };
  replies?: Comment[];
}

function AdminRecipeCommentsContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipeId = searchParams.get('recipeId');
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [filter, setFilter] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [recipeName, setRecipeName] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingReply, setEditingReply] = useState<{ id: string; content: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER'))) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'MANAGER')) {
      fetchComments();
    }
  }, [user, filter, recipeId]);

  const fetchComments = async () => {
    try {
      const url = `/api/admin/recipes/comments?status=${filter}${recipeId ? `&recipeId=${recipeId}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      
      const allComments = data.comments || [];
      const rootComments = allComments.filter((c: Comment) => !c.parentId);
      const replies = allComments.filter((c: Comment) => c.parentId);
      
      const commentsWithReplies = rootComments.map((root: Comment) => ({
        ...root,
        replies: replies.filter((r: Comment) => r.parentId === root.id)
      }));
      
      setComments(commentsWithReplies);
      
      if (data.comments?.length > 0 && data.comments[0]?.recipe) {
        setRecipeName(data.comments[0].recipe.title);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (commentId: string) => {
    try {
      const res = await fetch('/api/admin/recipes/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, action: 'approve' })
      });
      
      if (res.ok) {
        toast.success('Комментарий одобрен');
        fetchComments();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Удалить комментарий? Все ответы также будут удалены.')) return;
    
    try {
      const res = await fetch(`/api/recipes/comments?id=${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Комментарий удален');
        fetchComments();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) {
      toast.error('Введите текст ответа');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/admin/recipes/comments/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, content: replyText })
      });
      
      if (res.ok) {
        toast.success('Ответ добавлен');
        setReplyText('');
        setReplyingTo(null);
        fetchComments();
      } else {
        toast.error('Ошибка');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditReply = async (commentId: string) => {
    if (!editingReply?.content.trim()) {
      toast.error('Введите текст');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/admin/recipes/comments/reply', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, content: editingReply.content })
      });
      
      if (res.ok) {
        toast.success('Ответ обновлен');
        setEditingReply(null);
        fetchComments();
      } else {
        toast.error('Ошибка');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReply = async (commentId: string) => {
    if (!confirm('Удалить ответ?')) return;
    
    try {
      const res = await fetch(`/api/admin/recipes/comments/reply?id=${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Ответ удален');
        fetchComments();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  if (loading || isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {recipeId && (
            <Link href="/admin/recipes" className={styles.backLink}>
              <ArrowLeft size={18} />
              Назад к рецептам
            </Link>
          )}
          <h1 className={styles.title}>
            <ChefHat size={28} />
            {recipeName ? `Комментарии к рецепту "${recipeName}"` : 'Все комментарии к рецептам'}
          </h1>
        </div>
        <div className={styles.stats}>
          <span className={styles.pendingCount}>
            ⏳ Ожидают: {comments.filter(c => !c.isApproved).length}
          </span>
          <span className={styles.approvedCount}>
            ✅ Одобрено: {comments.filter(c => c.isApproved).length}
          </span>
        </div>
      </div>

      <div className={styles.filters}>
        <button onClick={() => setFilter('pending')} className={`${styles.filterBtn} ${filter === 'pending' ? styles.active : ''}`}>
          ⏳ На модерации
        </button>
        <button onClick={() => setFilter('approved')} className={`${styles.filterBtn} ${filter === 'approved' ? styles.active : ''}`}>
          ✅ Одобренные
        </button>
        <button onClick={() => setFilter('all')} className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}>
          📋 Все
        </button>
      </div>

      <div className={styles.commentsList}>
        {comments.length === 0 ? (
          <div className={styles.empty}>
            <MessageCircle size={48} />
            <p>Нет комментариев к рецептам</p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className={styles.commentCard}>
              <div className={styles.commentHeader}>
                <div className={styles.authorInfo}>
                  <strong>{comment.authorName}</strong>
                  {comment.authorEmail && (
                    <span className={styles.email}>{comment.authorEmail}</span>
                  )}
                  {comment.user?.role && comment.user.role !== 'USER' && (
                    <span className={`${styles.roleBadge} ${styles[comment.user.role.toLowerCase()]}`}>
                      {comment.user.role === 'ADMIN' ? '👑 Админ' : '🛡️ Менеджер'}
                    </span>
                  )}
                  <span className={`${styles.statusBadge} ${comment.isApproved ? styles.approved : styles.pending}`}>
                    {comment.isApproved ? '✅ Одобрен' : '⏳ Ожидает'}
                  </span>
                </div>
                <div className={styles.commentMeta}>
                  <span className={styles.date}>
                    {new Date(comment.createdAt).toLocaleString('ru-RU')}
                  </span>
                  <Link href={`/recipes/${comment.recipe.slug}`} className={styles.postLink} target="_blank">
                    <Eye size={14} />
                    {comment.recipe.title}
                  </Link>
                </div>
              </div>
              
              <div className={styles.commentContent}>
                {comment.content}
              </div>
              
              <div className={styles.commentActions}>
                {!comment.isApproved && (
                  <button onClick={() => handleApprove(comment.id)} className={styles.approveBtn}>
                    <CheckCircle size={16} />
                    Одобрить
                  </button>
                )}
                {comment.isApproved && (
                  <button onClick={() => setReplyingTo(comment.id)} className={styles.replyBtn}>
                    <Reply size={16} />
                    Ответить
                  </button>
                )}
                <button onClick={() => handleDelete(comment.id)} className={styles.deleteBtn}>
                  <Trash2 size={16} />
                  Удалить
                </button>
              </div>

              {comment.replies && comment.replies.length > 0 && (
                <div className={styles.repliesSection}>
                  <div className={styles.repliesHeader}>
                    <MessageCircle size={14} />
                    <span>Ответы ({comment.replies.length})</span>
                  </div>
                  {comment.replies.map(reply => (
                    <div key={reply.id} className={styles.replyItem}>
                      <div className={styles.replyHeader}>
                        <div className={styles.replyAuthor}>
                          <strong>{reply.authorName}</strong>
                          {reply.user?.role && reply.user.role !== 'USER' && (
                            <span className={`${styles.roleBadge} ${styles[reply.user.role.toLowerCase()]}`}>
                              {reply.user.role === 'ADMIN' ? '👑 Админ' : '🛡️ Менеджер'}
                            </span>
                          )}
                        </div>
                        <div className={styles.replyDate}>
                          {new Date(reply.createdAt).toLocaleString('ru-RU')}
                        </div>
                      </div>
                      {editingReply?.id === reply.id ? (
                        <div className={styles.editReplyForm}>
                          <textarea
                            value={editingReply.content}
                            onChange={(e) => setEditingReply({ ...editingReply, content: e.target.value })}
                            rows={2}
                            autoFocus
                          />
                          <div className={styles.editReplyActions}>
                            <button onClick={() => handleEditReply(reply.id)} disabled={isSubmitting}>
                              <Send size={14} />
                              Сохранить
                            </button>
                            <button onClick={() => setEditingReply(null)}>Отмена</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={styles.replyContent}>{reply.content}</div>
                          <div className={styles.replyActions}>
                            <button 
                              onClick={() => setEditingReply({ id: reply.id, content: reply.content })} 
                              className={styles.editReplyBtn}
                            >
                              <Edit2 size={14} />
                              Редактировать
                            </button>
                            <button onClick={() => handleDeleteReply(reply.id)} className={styles.deleteReplyBtn}>
                              <Trash2 size={14} />
                              Удалить
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {replyingTo === comment.id && (
                <div className={styles.replyForm}>
                  <textarea
                    placeholder="Введите ответ на комментарий..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    autoFocus
                  />
                  <div className={styles.replyActions}>
                    <button onClick={() => handleReply(comment.id)} disabled={isSubmitting} className={styles.submitReplyBtn}>
                      <Send size={14} />
                      {isSubmitting ? 'Отправка...' : 'Отправить ответ'}
                    </button>
                    <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className={styles.cancelReplyBtn}>
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

export default function AdminRecipeCommentsPage() {
  return (
    <Suspense fallback={<div className={styles.loader}>Загрузка...</div>}>
      <AdminRecipeCommentsContent />
    </Suspense>
  );
}