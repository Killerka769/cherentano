'use client';

import { Suspense, useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Trash2, Eye, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface Comment {
  id: string;
  authorName: string;
  authorEmail: string | null;
  content: string;
  isApproved: boolean;
  createdAt: string;
  post: {
    id: string;
    title: string;
    slug: string;
  };
}

function AdminCommentsContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [comments, setComments] = useState<Comment[]>([]);
  const [filter, setFilter] = useState(searchParams.get('status') || 'pending');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchComments();
    }
  }, [user, filter]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/admin/blog/comments?status=${filter}`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (commentId: string) => {
    try {
      const res = await fetch('/api/admin/blog/comments', {
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
    if (!confirm('Удалить комментарий?')) return;
    
    try {
      const res = await fetch('/api/admin/blog/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, action: 'delete' })
      });
      
      if (res.ok) {
        toast.success('Комментарий удален');
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
        <h1 className={styles.title}>
          <MessageCircle size={28} />
          Управление комментариями
        </h1>
      </div>

      <div className={styles.filters}>
        <button onClick={() => setFilter('pending')} className={`${styles.filterBtn} ${filter === 'pending' ? styles.active : ''}`}>
          ⏳ Ожидают ({comments.filter(c => !c.isApproved).length})
        </button>
        <button onClick={() => setFilter('approved')} className={`${styles.filterBtn} ${filter === 'approved' ? styles.active : ''}`}>
          ✅ Одобренные ({comments.filter(c => c.isApproved).length})
        </button>
      </div>

      <div className={styles.commentsList}>
        {comments.length === 0 ? (
          <div className={styles.empty}>
            <MessageCircle size={48} />
            <p>Нет комментариев</p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className={styles.commentCard}>
              <div className={styles.commentHeader}>
                <div>
                  <strong>{comment.authorName}</strong>
                  {comment.authorEmail && (
                    <span className={styles.email}>{comment.authorEmail}</span>
                  )}
                </div>
                <div className={styles.commentMeta}>
                  <span className={styles.date}>
                    {new Date(comment.createdAt).toLocaleString('ru-RU')}
                  </span>
                  <Link href={`/blog/${comment.post.slug}`} className={styles.postLink} target="_blank">
                    <Eye size={14} />
                    {comment.post.title}
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
                <button onClick={() => handleDelete(comment.id)} className={styles.deleteBtn}>
                  <Trash2 size={16} />
                  Удалить
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminCommentsPage() {
  return (
    <Suspense fallback={<div className={styles.loader}>Загрузка...</div>}>
      <AdminCommentsContent />
    </Suspense>
  );
}