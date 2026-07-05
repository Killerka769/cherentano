'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, User, Eye, MessageCircle, ArrowLeft, Clock, ChefHat, Send, Edit2, Trash2, Reply } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import ImageWithFallback from '@/app/components/ui/ImageWithFallback/ImageWithFallback';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface Comment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
  userId: string | null;
  isApproved: boolean;
  user?: {
    id: string;
    name: string;
    role: string;
  } | null;
  replies?: Comment[];
}

interface Recipe {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  author: string;
  views: number;
  cookingTime: number | null;
  servings: number | null;
  publishedAt: string;
  category: { name: string; slug: string };
  comments: Comment[];
}

export default function RecipePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editText, setEditText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [editingReply, setEditingReply] = useState<{ id: string; text: string } | null>(null);

  const slug = params?.slug as string;

  useEffect(() => {
    if (slug) {
      fetchRecipe();
    }
  }, [slug]);

  useEffect(() => {
    if (user) {
      setCommentName(user.name || '');
      setCommentEmail(user.email || '');
    }
  }, [user]);

  const fetchRecipe = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/recipes/${slug}`);
      if (!res.ok) {
        if (res.status === 404) router.push('/recipes');
        return;
      }
      const data = await res.json();
      setRecipe(data.recipe);
    } catch (error) {
      console.error('Failed to fetch recipe:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComment = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    
    if (!commentName || !commentText) {
      toast.error('Заполните имя и комментарий');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/recipes/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: recipe?.id,
          parentId: parentId || null,
          authorName: commentName,
          authorEmail: commentEmail,
          content: commentText
        })
      });
      
      if (res.ok) {
        toast.success(parentId ? 'Ответ отправлен на модерацию' : 'Комментарий отправлен на модерацию');
        setCommentText('');
        setReplyTo(null);
        fetchRecipe();
      } else {
        toast.error('Ошибка отправки');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) {
      toast.error('Напишите текст');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/recipes/comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          content: editText
        })
      });
      
      if (res.ok) {
        toast.success('Комментарий обновлен');
        setEditingComment(null);
        setEditText('');
        fetchRecipe();
      } else {
        toast.error('Ошибка обновления');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Удалить комментарий? Все ответы также будут удалены.')) return;
    
    try {
      const res = await fetch(`/api/recipes/comments?id=${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Комментарий удален');
        fetchRecipe();
      } else {
        toast.error('Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  const canEditComment = (comment: Comment) => {
    if (!user) return false;
    if (user.id === comment.userId) return true;
    if (user.role === 'ADMIN' || user.role === 'MANAGER') return true;
    return false;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Компонент отдельного комментария с ответами
  const CommentItem = ({ comment, level = 0 }: { comment: Comment; level?: number }) => {
    const canEdit = canEditComment(comment);
    const maxLevel = 3;
    const hasReplies = comment.replies && comment.replies.length > 0;

    return (
      <div className={`${styles.commentItem} ${level > 0 ? styles.nested : ''}`}>
        <div className={styles.commentHeader}>
          <div className={styles.commentAuthor}>
            <strong>{comment.authorName}</strong>
            {comment.user?.role && comment.user.role !== 'USER' && (
              <span className={styles.roleBadge}>
                {comment.user.role === 'ADMIN' ? '👑 Админ' : '🛡️ Менеджер'}
              </span>
            )}
            {!comment.isApproved && (
              <span className={styles.pendingBadge}>⏳ На модерации</span>
            )}
          </div>
          <div className={styles.commentDate}>
            {formatDate(comment.createdAt)}
            {comment.updatedAt !== comment.createdAt && (
              <span className={styles.edited}> (изменено)</span>
            )}
          </div>
        </div>
        
        {editingComment?.id === comment.id ? (
          <div className={styles.editForm}>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className={styles.editActions}>
              <button onClick={() => handleEditComment(comment.id)} disabled={isSubmitting}>
                Сохранить
              </button>
              <button onClick={() => { setEditingComment(null); setEditText(''); }}>
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.commentContent}>{comment.content}</div>
            <div className={styles.commentActions}>
              {level < maxLevel && user && (user.role === 'ADMIN' || user.role === 'MANAGER') && (
                <button onClick={() => setReplyTo(comment)} className={styles.replyBtn}>
                  <Reply size={14} />
                  Ответить
                </button>
              )}
              {canEdit && (
                <>
                  <button 
                    onClick={() => {
                      setEditingComment(comment);
                      setEditText(comment.content);
                    }} 
                    className={styles.editBtn}
                  >
                    <Edit2 size={14} />
                    Редактировать
                  </button>
                  <button onClick={() => handleDeleteComment(comment.id)} className={styles.deleteBtn}>
                    <Trash2 size={14} />
                    Удалить
                  </button>
                </>
              )}
            </div>
          </>
        )}
        
        {/* Ответы на комментарий */}
        {hasReplies && (
          <div className={styles.repliesSection}>
            <div className={styles.repliesHeader}>
              <MessageCircle size={14} />
              <span>Ответы ({comment.replies!.length})</span>
            </div>
            {comment.replies!.map(reply => {
              const canEditReply = canEditComment(reply);
              
              return (
                <div key={reply.id} className={styles.replyItem}>
                  <div className={styles.replyHeader}>
                    <div className={styles.replyAuthor}>
                      <strong>{reply.authorName}</strong>
                      {reply.user?.role && reply.user.role !== 'USER' && (
                        <span className={styles.roleBadge}>
                          {reply.user.role === 'ADMIN' ? '👑 Админ' : '🛡️ Менеджер'}
                        </span>
                      )}
                    </div>
                    <div className={styles.replyDate}>
                      {formatDate(reply.createdAt)}
                      {reply.updatedAt !== reply.createdAt && (
                        <span className={styles.edited}> (изменено)</span>
                      )}
                    </div>
                  </div>
                  
                  {editingReply?.id === reply.id ? (
                    <div className={styles.editReplyForm}>
                      <textarea
                        value={editingReply.text}
                        onChange={(e) => setEditingReply({ ...editingReply, text: e.target.value })}
                        rows={2}
                        autoFocus
                      />
                      <div className={styles.editReplyActions}>
                        <button onClick={() => {
                          if (!editingReply.text.trim()) {
                            toast.error('Напишите текст');
                            return;
                          }
                          handleEditComment(reply.id);
                          setEditingReply(null);
                        }} disabled={isSubmitting}>
                          Сохранить
                        </button>
                        <button onClick={() => setEditingReply(null)}>Отмена</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={styles.replyContent}>{reply.content}</div>
                      {canEditReply && (
                        <div className={styles.replyActions}>
                          <button 
                            onClick={() => setEditingReply({ id: reply.id, text: reply.content })} 
                            className={styles.editReplyBtn}
                          >
                            <Edit2 size={14} />
                            Редактировать
                          </button>
                          <button onClick={() => handleDeleteComment(reply.id)} className={styles.deleteReplyBtn}>
                            <Trash2 size={14} />
                            Удалить
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  if (!recipe) {
    return (
      <div className={styles.notFound}>
        <h2>Рецепт не найден</h2>
        <Link href="/recipes">Вернуться к рецептам</Link>
      </div>
    );
  }

  const rootComments = recipe.comments.filter(c => !c.parentId);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/recipes" className={styles.backLink}>
          <ArrowLeft size={18} />
          Назад к рецептам
        </Link>
      </div>

      <article className={styles.article}>
        <div className={styles.image}>
          <ImageWithFallback
            src={recipe.imageUrl || ''}
            alt={recipe.title}
            className={styles.image}
            fallback="dish"
          />
        </div>
        
        <div className={styles.meta}>
          <span className={styles.category}>{recipe.category.name}</span>
          <span><Calendar size={14} /> {new Date(recipe.publishedAt).toLocaleDateString('ru-RU')}</span>
          <span><User size={14} /> {recipe.author}</span>
          {recipe.cookingTime && (
            <span><Clock size={14} /> {recipe.cookingTime} мин</span>
          )}
          {recipe.servings && (
            <span><ChefHat size={14} /> {recipe.servings} порции</span>
          )}
          <span><Eye size={14} /> {recipe.views}</span>
        </div>
        
        <h1 className={styles.title}>{recipe.title}</h1>
        
        <div 
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: recipe.content }}
        />
        
        {/* Комментарии */}
        <div className={styles.commentsSection}>
          <h3 className={styles.commentsTitle}>
            <MessageCircle size={18} />
            Комментарии ({rootComments.length})
          </h3>
          
          <div className={styles.commentFormWrapper}>
            {replyTo && (
              <div className={styles.replyInfo}>
                <span>Ответ для <strong>{replyTo.authorName}</strong></span>
                <button onClick={() => setReplyTo(null)} className={styles.cancelReplyBtn}>✕</button>
              </div>
            )}
            <form onSubmit={(e) => handleComment(e, replyTo?.id)} className={styles.commentForm}>
              <input
                type="text"
                placeholder="Ваше имя *"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                required
                disabled={!!user}
                className={user ? styles.disabled : ''}
              />
              <input
                type="email"
                placeholder="Email (не обязательно)"
                value={commentEmail}
                onChange={(e) => setCommentEmail(e.target.value)}
                disabled={!!user}
                className={user ? styles.disabled : ''}
              />
              <textarea
                placeholder={replyTo ? `Ответ для ${replyTo.authorName}...` : "Ваш комментарий *"}
                rows={4}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
              />
              <button type="submit" disabled={isSubmitting}>
                <Send size={16} />
                {isSubmitting ? 'Отправка...' : replyTo ? 'Ответить' : 'Отправить комментарий'}
              </button>
              <p className={styles.note}>Комментарий появится после проверки модератором</p>
            </form>
          </div>
          
          <div className={styles.commentsList}>
            {rootComments.length === 0 ? (
              <p className={styles.noComments}>Пока нет комментариев. Будьте первым!</p>
            ) : (
              rootComments.map(comment => (
                <CommentItem key={comment.id} comment={comment} />
              ))
            )}
          </div>
        </div>
      </article>
    </div>
  );
}