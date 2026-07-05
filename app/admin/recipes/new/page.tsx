'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function NewRecipePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    imageUrl: '',
    categoryId: '',
    author: '',
    cookingTime: '',
    servings: '',
    difficulty: 'MEDIUM',
    isPublished: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recipeId = params?.id as string;

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    fetchCategories();
    if (recipeId) {
      setIsEditing(true);
      fetchRecipe();
    } else {
      setIsLoading(false);
    }
  }, [recipeId]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/recipes/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchRecipe = async () => {
    try {
      const res = await fetch(`/api/recipes/${recipeId}`);
      const data = await res.json();
      const recipe = data.recipe;
      setFormData({
        title: recipe.title,
        slug: recipe.slug,
        excerpt: recipe.excerpt || '',
        content: recipe.content,
        imageUrl: recipe.imageUrl || '',
        categoryId: recipe.categoryId,
        author: recipe.author || '',
        cookingTime: recipe.cookingTime ? String(recipe.cookingTime) : '',
        servings: recipe.servings ? String(recipe.servings) : '',
        difficulty: recipe.difficulty || 'MEDIUM',
        isPublished: recipe.isPublished
      });
    } catch (error) {
      console.error('Failed to fetch recipe:', error);
      toast.error('Ошибка загрузки рецепта');
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
    
    if (!formData.title || !formData.content || !formData.categoryId) {
      toast.error('Заполните обязательные поля');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const url = isEditing ? '/api/admin/recipes' : '/api/admin/recipes';
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing 
        ? { id: recipeId, ...formData }
        : formData;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          slug: formData.slug || generateSlug(formData.title),
          cookingTime: formData.cookingTime ? parseInt(formData.cookingTime) : null,
          servings: formData.servings ? parseInt(formData.servings) : null
        })
      });
      
      if (res.ok) {
        toast.success(isEditing ? 'Рецепт обновлен' : 'Рецепт создан');
        router.push('/admin/recipes');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Ошибка');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/admin/recipes" className={styles.backLink}>
          <ArrowLeft size={18} />
          Назад к списку
        </Link>
        <h1 className={styles.title}>{isEditing ? 'Редактировать' : 'Новый'} рецепт</h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.main}>
          <div className={styles.field}>
            <label>Заголовок *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: generateSlug(e.target.value) })}
              placeholder="Например: Хинкал по-дагестански"
              required
            />
          </div>

          <div className={styles.field}>
            <label>URL (slug)</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="hinkal-po-dagestanski"
            />
            <p className={styles.hint}>Оставьте пустым для автоматической генерации</p>
          </div>

          <div className={styles.field}>
            <label>Краткое описание</label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Коротко о рецепте"
              rows={3}
            />
          </div>

          <div className={styles.field}>
            <label>Содержание *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Полный текст рецепта с HTML-разметкой"
              rows={12}
              required
            />
            <p className={styles.hint}>Поддерживается HTML: &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;img&gt;</p>
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
            <h3>Параметры</h3>
            <div className={styles.row}>
              <div className={styles.fieldSmall}>
                <label>Время (мин)</label>
                <input
                  type="number"
                  value={formData.cookingTime}
                  onChange={(e) => setFormData({ ...formData, cookingTime: e.target.value })}
                  placeholder="60"
                  min="1"
                />
              </div>
              <div className={styles.fieldSmall}>
                <label>Порции</label>
                <input
                  type="number"
                  value={formData.servings}
                  onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                  placeholder="4"
                  min="1"
                />
              </div>
            </div>
            <div className={styles.field}>
              <label>Сложность</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              >
                <option value="EASY">Легкий</option>
                <option value="MEDIUM">Средний</option>
                <option value="HARD">Сложный</option>
              </select>
            </div>
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
            {isSubmitting ? 'Сохранение...' : isEditing ? 'Обновить рецепт' : 'Сохранить рецепт'}
          </button>
        </div>
      </form>
    </div>
  );
}