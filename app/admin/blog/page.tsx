'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Eye, EyeOff, Calendar, User, MessageCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  imageUrl: string | null;
  author: string;
  views: number;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  category: Category;
  _count: { comments: number };
}

export default function AdminBlogPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchPosts();
    }
  }, [user, filter]);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`/api/admin/blog/posts?status=${filter}`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePublish = async (post: BlogPost) => {
    try {
      const res = await fetch('/api/admin/blog/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: '',
          imageUrl: post.imageUrl,
          categoryId: post.category.id,
          author: post.author,
          isPublished: !post.isPublished
        })
      });
      
      if (res.ok) {
        toast.success(post.isPublished ? 'Снято с публикации' : 'Опубликовано');
        fetchPosts();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const deletePost = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/blog/posts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Статья удалена');
        fetchPosts();
        setShowDeleteModal(null);
      }
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  if (loading || isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <FileText size={28} />
          Управление блогом
        </h1>
        <Link href="/admin/blog/new" className={styles.addBtn}>
          <Plus size={18} />
          Новая статья
        </Link>
      </div>

      <div className={styles.filters}>
        <button onClick={() => setFilter('all')} className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}>
          Все ({posts.length})
        </button>
        <button onClick={() => setFilter('published')} className={`${styles.filterBtn} ${filter === 'published' ? styles.active : ''}`}>
          Опубликованные ({posts.filter(p => p.isPublished).length})
        </button>
        <button onClick={() => setFilter('draft')} className={`${styles.filterBtn} ${filter === 'draft' ? styles.active : ''}`}>
          Черновики ({posts.filter(p => !p.isPublished).length})
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Название</th>
              <th>Категория</th>
              <th>Автор</th>
              <th>Просмотры</th>
              <th>Комментарии</th>
              <th>Дата</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <tr key={post.id}>
                <td className={styles.titleCell}>
                  <div>
                    <div className={styles.postTitle}>{post.title}</div>
                    <div className={styles.postSlug}>{post.slug}</div>
                  </div>
                </td>
                <td>{post.category.name}</td>
                <td>{post.author}</td>
                <td>{post.views}</td>
                <td>
                    <Link href={`/admin/blog/comments?post=${post.id}`} className={styles.commentLink}>
                        <MessageCircle size={14} />
                        {post._count.comments}
                    </Link>
                </td>

                <td>
                  {post.publishedAt 
                    ? new Date(post.publishedAt).toLocaleDateString('ru-RU')
                    : '—'}
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${post.isPublished ? styles.published : styles.draft}`}>
                    {post.isPublished ? 'Опубликовано' : 'Черновик'}
                  </span>
                </td>
                <td className={styles.actions}>
                <Link href={`/admin/blog/edit/${post.id}`} className={styles.editBtn} title="Редактировать">
                <Edit2 size={16} />
                </Link>
                  <button onClick={() => togglePublish(post)} className={styles.publishBtn} title={post.isPublished ? 'Снять с публикации' : 'Опубликовать'}>
                    {post.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button onClick={() => setShowDeleteModal(post.id)} className={styles.deleteBtn} title="Удалить">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {posts.length === 0 && (
        <div className={styles.empty}>
          <FileText size={48} />
          <p>Нет статей</p>
          <Link href="/admin/blog/new" className={styles.emptyBtn}>
            Создать первую статью
          </Link>
        </div>
      )}

      {/* Модальное окно удаления */}
      {showDeleteModal && (
        <div className={styles.modal} onClick={() => setShowDeleteModal(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3>Удалить статью?</h3>
            <p>Это действие нельзя отменить. Статья и все комментарии будут удалены.</p>
            <div className={styles.modalButtons}>
              <button onClick={() => deletePost(showDeleteModal)} className={styles.dangerBtn}>
                Удалить
              </button>
              <button onClick={() => setShowDeleteModal(null)} className={styles.cancelBtn}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}