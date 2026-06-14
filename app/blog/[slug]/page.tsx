'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, User, Eye, MessageCircle, ArrowLeft, Send, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import ImageWithFallback from '@/app/components/ui/ImageWithFallback/ImageWithFallback';
import RoleBadge from '@/app/components/ui/RoleBadge/RoleBadge';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface User {
  id: string;
  name: string | null;
  role: 'USER' | 'MANAGER' | 'ADMIN';
}

interface Comment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  parentId?: string | null;
  userId?: string | null;
  user?: User | null;
  replies?: Comment[];
}

interface BlogPost {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  author: string;
  views: number;
  publishedAt: string;
  category: { name: string; slug: string };
  comments: Comment[];
}

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const slug = params?.slug as string;

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  useEffect(() => {
    if (user) {
      setCommentName(user.name || user.email?.split('@')[0] || '');
      setCommentEmail(user.email || '');
    }
  }, [user]);

  const fetchPost = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/blog/posts/${slug}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push('/blog');
        }
        return;
      }
      const data = await res.json();
      setPost(data.post);
    } catch (error) {
      console.error('Failed to fetch post:', error);
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
      const res = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post?.id,
          parentId: parentId || null,
          authorName: commentName,
          authorEmail: commentEmail,
          content: commentText
        })
      });
      
      if (res.ok) {
        toast.success('Комментарий отправлен на модерацию');
        if (!user) {
          setCommentName('');
          setCommentEmail('');
        }
        setCommentText('');
        setReplyTo(null);
        fetchPost();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Ошибка отправки');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
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

  const canViewProfile = (commentUserId?: string | null) => {
    return commentUserId && (
      user?.role === 'ADMIN' || 
      user?.role === 'MANAGER' || 
      user?.id === commentUserId
    );
  };

  if (isLoading) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.spinner}></div>
        <p>Загрузка статьи...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className={styles.notFound}>
        <h2>Статья не найдена</h2>
        <p>Возможно, она была удалена или ещё не опубликована</p>
        <Link href="/blog" className={styles.backLink}>
          <ArrowLeft size={18} />
          Вернуться в блог
        </Link>
      </div>
    );
  }

  // Рекурсивный компонент для отображения комментария
  const renderComment = (comment: Comment, level: number = 0) => {
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isExpanded = expandedReplies.has(comment.id);
    const maxLevel = 3;
    const showProfileLink = canViewProfile(comment.userId);

    return (
      <div key={comment.id} className={`${styles.commentItem} ${level > 0 ? styles.nested : ''}`}>
        <div className={styles.commentHeader}>
          <div className={styles.authorWrapper}>
            {showProfileLink ? (
              <Link href={`/profile/${comment.userId}`} className={styles.authorLink}>
                <strong>{comment.authorName}</strong>
              </Link>
            ) : (
              <strong>{comment.authorName}</strong>
            )}
            <RoleBadge role={comment.user?.role} />
          </div>
          <span className={styles.commentDate}>{formatDate(comment.createdAt)}</span>
        </div>
        <div className={styles.commentContent}>{comment.content}</div>
        <div className={styles.commentActions}>
          {level < maxLevel && (
            <button onClick={() => setReplyTo(comment)} className={styles.replyBtn}>
              <Reply size={14} />
              Ответить
            </button>
          )}
          {hasReplies && (
            <button onClick={() => toggleReplies(comment.id)} className={styles.toggleBtn}>
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {comment.replies?.length} {comment.replies?.length === 1 ? 'ответ' : 'ответов'}
            </button>
          )}
        </div>
        
        {isExpanded && hasReplies && (
          <div className={styles.replies}>
            {comment.replies?.map(reply => renderComment(reply, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Группируем комментарии по parentId
  const rootComments = post.comments.filter(c => !c.parentId);
  const commentMap = new Map<string, Comment>();
  post.comments.forEach(c => { 
    commentMap.set(c.id, { ...c, replies: [] }); 
  });
  post.comments.forEach(c => {
    if (c.parentId) {
      const parent = commentMap.get(c.parentId);
      if (parent) {
        if (!parent.replies) parent.replies = [];
        parent.replies.push(commentMap.get(c.id)!);
      }
    }
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/blog" className={styles.backLink}>
          <ArrowLeft size={18} />
          Назад к статьям
        </Link>
      </div>

      <article className={styles.article}>
        {/* Изображение статьи */}
        <div className={styles.image}>
          <ImageWithFallback
            src={post.imageUrl || '/images/blog-placeholder.jpg'}
            alt={post.title}
            className={styles.image}
            fallback="blog"
          />
        </div>
        
        {/* Мета-информация */}
        <div className={styles.meta}>
          <span className={styles.category}>
            {post.category.name}
          </span>
          <span className={styles.date}>
            <Calendar size={14} />
            {new Date(post.publishedAt).toLocaleDateString('ru-RU')}
          </span>
          <span className={styles.author}>
            <User size={14} />
            {post.author}
          </span>
          <span className={styles.views}>
            <Eye size={14} />
            {post.views}
          </span>
        </div>
        
        {/* Заголовок */}
        <h1 className={styles.title}>{post.title}</h1>
        
        {/* Содержание статьи */}
        <div 
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        
        {/* Секция комментариев */}
        <div className={styles.commentsSection}>
          <h3 className={styles.commentsTitle}>
            <MessageCircle size={18} />
            Комментарии ({rootComments.length})
          </h3>
          
          {/* Форма добавления комментария */}
          <div className={styles.formWrapper}>
            {replyTo && (
              <div className={styles.replyInfo}>
                <span>Ответ для <strong>{replyTo.authorName}</strong></span>
                <button onClick={() => setReplyTo(null)} className={styles.cancelReply}>✕</button>
              </div>
            )}
            <form onSubmit={(e) => handleComment(e, replyTo?.id)} className={styles.commentForm}>
              <div className={styles.formRow}>
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
              </div>
              <textarea
                placeholder={replyTo ? `Ответ для ${replyTo.authorName}...` : "Ваш комментарий *"}
                rows={4}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
              />
              <div className={styles.formActions}>
                <button type="submit" disabled={isSubmitting}>
                  <Send size={16} />
                  {isSubmitting ? 'Отправка...' : replyTo ? 'Ответить' : 'Отправить комментарий'}
                </button>
                {replyTo && (
                  <button type="button" onClick={() => setReplyTo(null)} className={styles.cancelReplyBtn}>
                    Отмена
                  </button>
                )}
              </div>
            </form>
            <p className={styles.note}>
              Комментарий появится после проверки модератором
            </p>
          </div>
          
          {/* Список комментариев */}
          <div className={styles.commentsList}>
            {rootComments.length === 0 ? (
              <div className={styles.noComments}>
                <MessageCircle size={48} />
                <p>Пока нет комментариев</p>
                <span>Будьте первым, кто оставит комментарий!</span>
              </div>
            ) : (
              rootComments.map(comment => renderComment(comment, 0))
            )}
          </div>
        </div>
      </article>
    </div>
  );
}