'use client';

import { useState } from 'react';
import { MessageCircle, Reply, Send, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './CommentSection.module.scss';

interface Comment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  replies?: Comment[];
  parentId?: string | null;
}

interface CommentSectionProps {
  postId: string;
  initialComments: Comment[];
}

export default function CommentSection({ postId, initialComments }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [formData, setFormData] = useState({
    authorName: '',
    authorEmail: '',
    content: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    
    if (!formData.authorName || !formData.content) {
      toast.error('Заполните имя и комментарий');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          parentId: parentId || null,
          authorName: formData.authorName,
          authorEmail: formData.authorEmail,
          content: formData.content
        })
      });
      
      if (res.ok) {
        toast.success('Комментарий отправлен на модерацию');
        setFormData({ authorName: '', authorEmail: '', content: '' });
        setReplyTo(null);
        // Перезагружаем комментарии
        const commentsRes = await fetch(`/api/blog/comments?postId=${postId}`);
        const data = await commentsRes.json();
        setComments(data.comments || []);
      } else {
        toast.error('Ошибка отправки');
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

  const CommentItem = ({ comment, level = 0 }: { comment: Comment; level?: number }) => {
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isExpanded = expandedReplies.has(comment.id);
    const maxLevel = 3; // Максимальная глубина вложенности

    return (
      <div className={`${styles.commentItem} ${level > 0 ? styles.nested : ''}`} style={{ marginLeft: level > 0 ? 40 : 0 }}>
        <div className={styles.commentHeader}>
          <strong>{comment.authorName}</strong>
          <span className={styles.date}>{formatDate(comment.createdAt)}</span>
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
            {comment.replies?.map(reply => (
              <CommentItem key={reply.id} comment={reply} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.commentsSection}>
      <h3 className={styles.title}>
        <MessageCircle size={20} />
        Комментарии ({comments.length})
      </h3>

      {/* Форма добавления комментария */}
      <div className={styles.formWrapper}>
        {replyTo && (
          <div className={styles.replyInfo}>
            Ответ для <strong>{replyTo.authorName}</strong>
            <button onClick={() => setReplyTo(null)} className={styles.cancelReply}>✕</button>
          </div>
        )}
        <form onSubmit={(e) => handleSubmit(e, replyTo?.id)} className={styles.commentForm}>
          <input
            type="text"
            placeholder="Ваше имя *"
            value={formData.authorName}
            onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email (не обязательно)"
            value={formData.authorEmail}
            onChange={(e) => setFormData({ ...formData, authorEmail: e.target.value })}
          />
          <textarea
            placeholder={replyTo ? `Ответ для ${replyTo.authorName}...` : "Ваш комментарий *"}
            rows={3}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            required
          />
          <button type="submit" disabled={isSubmitting}>
            <Send size={16} />
            {isSubmitting ? 'Отправка...' : replyTo ? 'Ответить' : 'Отправить комментарий'}
          </button>
        </form>
        <p className={styles.note}>Комментарий появится после проверки модератором</p>
      </div>

      {/* Список комментариев */}
      <div className={styles.commentsList}>
        {comments.length === 0 ? (
          <p className={styles.noComments}>Пока нет комментариев. Будьте первым!</p>
        ) : (
          comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}