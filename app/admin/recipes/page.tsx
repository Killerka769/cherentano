'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Eye, EyeOff, ChefHat, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Recipe {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl: string | null;
  author: string;
  cookingTime: number | null;
  servings: number | null;
  views: number;          // 👈 Добавляем поле views
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  category: Category;
  _count?: { comments: number };
}

export default function AdminRecipesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  
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

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchRecipes();
      fetchCategories();
    }
  }, [user, filter]);

  const fetchRecipes = async () => {
    try {
      const res = await fetch(`/api/admin/recipes?status=${filter}`);
      const data = await res.json();
      setRecipes(data.recipes || []);
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
      toast.error('Ошибка загрузки рецептов');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/recipes/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content || !formData.categoryId) {
      toast.error('Заполните обязательные поля');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const url = editingRecipe ? '/api/admin/recipes' : '/api/admin/recipes';
      const method = editingRecipe ? 'PUT' : 'POST';
      const body = editingRecipe 
        ? { id: editingRecipe.id, ...formData }
        : formData;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        toast.success(editingRecipe ? 'Рецепт обновлен' : 'Рецепт создан');
        setIsModalOpen(false);
        setEditingRecipe(null);
        setFormData({
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
        fetchRecipes();
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

  const togglePublish = async (recipe: Recipe) => {
    try {
      const res = await fetch('/api/admin/recipes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: recipe.id,
          title: recipe.title,
          slug: recipe.slug,
          excerpt: recipe.excerpt,
          content: recipe.content,
          imageUrl: recipe.imageUrl,
          categoryId: recipe.category.id,
          author: recipe.author,
          cookingTime: recipe.cookingTime,
          servings: recipe.servings,
          difficulty: 'MEDIUM',
          isPublished: !recipe.isPublished
        })
      });
      
      if (res.ok) {
        toast.success(recipe.isPublished ? 'Рецепт снят с публикации' : 'Рецепт опубликован');
        fetchRecipes();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const deleteRecipe = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/recipes?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Рецепт удален');
        fetchRecipes();
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
          <ChefHat size={28} />
          Управление рецептами
        </h1>
        <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}>
          <Plus size={18} /> Добавить рецепт
        </button>
      </div>

      <div className={styles.filters}>
        <button onClick={() => setFilter('all')} className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}>
          Все ({recipes.length})
        </button>
        <button onClick={() => setFilter('published')} className={`${styles.filterBtn} ${filter === 'published' ? styles.active : ''}`}>
          Опубликованные ({recipes.filter(r => r.isPublished).length})
        </button>
        <button onClick={() => setFilter('draft')} className={`${styles.filterBtn} ${filter === 'draft' ? styles.active : ''}`}>
          Черновики ({recipes.filter(r => !r.isPublished).length})
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Название</th>
              <th>Категория</th>
              <th>Время</th>
              <th>Порции</th>
              <th>Просмотры</th>
              <th>Комментарии</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map(recipe => (
              <tr key={recipe.id}>
                <td className={styles.titleCell}>
                  <div className={styles.recipeTitle}>{recipe.title}</div>
                  <div className={styles.recipeSlug}>{recipe.slug}</div>
                </td>
                <td>{recipe.category?.name || '-'}</td>
                <td>{recipe.cookingTime ? `${recipe.cookingTime} мин` : '-'}</td>
                <td>{recipe.servings || '-'}</td>
                <td>{recipe.views || 0}</td>
                <td>
                  <Link href={`/admin/recipes/comments?recipeId=${recipe.id}`} className={styles.commentLink}>
                    <MessageCircle size={14} />
                    {recipe._count?.comments || 0}
                  </Link>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${recipe.isPublished ? styles.published : styles.draft}`}>
                    {recipe.isPublished ? 'Опубликовано' : 'Черновик'}
                  </span>
                </td>
                <td className={styles.actions}>
                  <button 
                    onClick={() => {
                      setEditingRecipe(recipe);
                      setFormData({
                        title: recipe.title,
                        slug: recipe.slug,
                        excerpt: recipe.excerpt || '',
                        content: recipe.content,
                        imageUrl: recipe.imageUrl || '',
                        categoryId: recipe.category.id,
                        author: recipe.author || '',
                        cookingTime: String(recipe.cookingTime || ''),
                        servings: String(recipe.servings || ''),
                        difficulty: 'MEDIUM',
                        isPublished: recipe.isPublished
                      });
                      setIsModalOpen(true);
                    }} 
                    className={styles.editBtn}
                    title="Редактировать"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => togglePublish(recipe)} className={styles.publishBtn} title={recipe.isPublished ? 'Снять с публикации' : 'Опубликовать'}>
                    {recipe.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button onClick={() => setShowDeleteModal(recipe.id)} className={styles.deleteBtn} title="Удалить">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {recipes.length === 0 && (
        <div className={styles.empty}>
          <ChefHat size={48} />
          <p>Нет рецептов</p>
          <button onClick={() => setIsModalOpen(true)} className={styles.emptyBtn}>
            Создать первый рецепт
          </button>
        </div>
      )}

      {/* Модальное окно создания/редактирования */}
      {isModalOpen && (
        <div className={styles.modal} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2>{editingRecipe ? 'Редактировать' : 'Создать'} рецепт</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>Название *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              
              <div className={styles.field}>
                <label>URL (slug)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="автогенерация"
                />
              </div>
              
              <div className={styles.field}>
                <label>Краткое описание</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={2}
                />
              </div>
              
              <div className={styles.field}>
                <label>Содержание *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  required
                />
              </div>
              
              <div className={styles.field}>
                <label>URL изображения</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Категория *</label>
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
                
                <div className={styles.field}>
                  <label>Автор</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Ресторан Челентано"
                  />
                </div>
              </div>
              
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Время готовки (мин)</label>
                  <input
                    type="number"
                    value={formData.cookingTime}
                    onChange={(e) => setFormData({ ...formData, cookingTime: e.target.value })}
                    placeholder="30"
                  />
                </div>
                
                <div className={styles.field}>
                  <label>Количество порций</label>
                  <input
                    type="number"
                    value={formData.servings}
                    onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                    placeholder="4"
                  />
                </div>
              </div>
              
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Сложность</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  >
                    <option value="EASY">Легкая</option>
                    <option value="MEDIUM">Средняя</option>
                    <option value="HARD">Сложная</option>
                  </select>
                </div>
                
                <div className={styles.field}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    />
                    Опубликовать сразу
                  </label>
                </div>
              </div>
              
              <div className={styles.modalButtons}>
                <button type="submit" disabled={isSubmitting} className={styles.saveBtn}>
                  {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно удаления */}
      {showDeleteModal && (
        <div className={styles.modal} onClick={() => setShowDeleteModal(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3>Удалить рецепт?</h3>
            <p>Это действие нельзя отменить. Все комментарии также будут удалены.</p>
            <div className={styles.modalButtons}>
              <button onClick={() => deleteRecipe(showDeleteModal)} className={styles.dangerBtn}>
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