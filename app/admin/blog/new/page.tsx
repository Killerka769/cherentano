'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function NewPostPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    imageUrl: '',
    categoryId: '',
    author: '',
    isPublished: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/blog/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
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
    
    if (!formData.title || !formData.content || !formData.categoryId) {
      toast.error('Заполните обязательные поля');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/admin/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          slug: formData.slug || generateSlug(formData.title)
        })
      });
      
      if (res.ok) {
        toast.success('Статья создана');
        router.push('/admin/blog');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Ошибка создания');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/admin/blog" className={styles.backLink}>
          <ArrowLeft size={18} />
          Назад к списку
        </Link>
        <h1 className={styles.title}>Новая статья</h1>
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
              placeholder="Например: История дагестанского чуду"
              required
            />
          </div>

          <div className={styles.field}>
            <label>URL (slug)</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="avtomaticheski-generiruetsya"
            />
            <p className={styles.hint}>Оставьте пустым для автоматической генерации</p>
          </div>

          <div className={styles.field}>
            <label>Краткое описание</label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Коротко о чем статья (для превью)"
              rows={3}
            />
          </div>

          <div className={styles.field}>
            <label>Содержание *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Полный текст статьи. Поддерживается HTML"
              rows={12}
              required
            />
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
              value={formData.imageUrl}
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
              placeholder="Ресторан Челентано"
            />
          </div>

          <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
            <Save size={18} />
            {isSubmitting ? 'Сохранение...' : 'Сохранить статью'}
          </button>
        </div>
      </form>
    </div>
  );
}