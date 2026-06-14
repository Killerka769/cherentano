'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, EyeOff, Trash2 } from 'lucide-react';
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
  content: string;
  imageUrl: string | null;
  categoryId: string;
  author: string;
  isPublished: boolean;
}

export default function EditPostPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const postId = params?.id as string;

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (postId) {
      fetchCategories();
      fetchPost();
    }
  }, [postId]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/blog/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/admin/blog/posts/${postId}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error('Статья не найдена');
          router.push('/admin/blog');
        }
        return;
      }
      const data = await res.json();
      setFormData(data.post);
    } catch (error) {
      console.error('Failed to fetch post:', error);
      toast.error('Ошибка загрузки статьи');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^а-яёa-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData) return;
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/admin/blog/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formData.id,
          title: formData.title,
          slug: formData.slug || generateSlug(formData.title),
          excerpt: formData.excerpt,
          content: formData.content,
          imageUrl: formData.imageUrl,
          categoryId: formData.categoryId,
          author: formData.author,
          isPublished: formData.isPublished
        })
      });
      
      if (res.ok) {
        toast.success('Статья обновлена');
        router.push('/admin/blog');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Ошибка обновления');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Удалить статью? Это действие нельзя отменить.')) return;
    
    try {
      const res = await fetch(`/api/admin/blog/posts?id=${postId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Статья удалена');
        router.push('/admin/blog');
      } else {
        toast.error('Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  if (loading || isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  if (!formData) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>Статья не найдена</h2>
          <Link href="/admin/blog" className={styles.backLink}>Вернуться к списку</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/admin/blog" className={styles.backLink}>
          <ArrowLeft size={18} />
          Назад к списку
        </Link>
        <h1 className={styles.title}>Редактирование статьи</h1>
        <button onClick={handleDelete} className={styles.deleteBtn}>
          <Trash2 size={18} />
          Удалить
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.main}>
          <div className={styles.field}>
            <label>Заголовок *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  title: e.target.value,
                  slug: generateSlug(e.target.value)
                });
              }}
              required
            />
          </div>

          <div className={styles.field}>
            <label>URL (slug)</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            />
            <p className={styles.hint}>Оставьте пустым для автоматической генерации</p>
          </div>

          <div className={styles.field}>
            <label>Краткое описание</label>
            <textarea
              value={formData.excerpt || ''}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              rows={3}
            />
          </div>

          <div className={styles.field}>
            <label>Содержание *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={12}
              required
            />
            <p className={styles.hint}>Поддерживается HTML: &lt;p&gt;, &lt;h2&gt;, &lt;img&gt;, и т.д.</p>
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.card}>
            <h3>Публикация</h3>
            <div className={styles.publishOptions}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPublished: false })}
                className={`${styles.publishBtn} ${!formData.isPublished ? styles.active : ''}`}
              >
                <EyeOff size={16} />
                Черновик
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPublished: true })}
                className={`${styles.publishBtn} ${formData.isPublished ? styles.active : ''}`}
              >
                <Eye size={16} />
                Опубликовать
              </button>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Изображение</h3>
            <input
              type="text"
              value={formData.imageUrl || ''}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="URL изображения"
            />
            {formData.imageUrl && (
              <div className={styles.imagePreview}>
                <img src={formData.imageUrl} alt="Preview" />
              </div>
            )}
          </div>

          <div className={styles.card}>
            <h3>Категория *</h3>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              required
            >
              <option value="">Выберите категорию</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.card}>
            <h3>Автор</h3>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            />
          </div>

          <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
            <Save size={18} />
            {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </form>
    </div>
  );
}