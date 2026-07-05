'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default function AdminRecipeCategoriesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/recipe-categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Ошибка загрузки категорий');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Введите название категории');
      return;
    }
    
    try {
      const url = editingCategory 
        ? '/api/admin/recipe-categories'
        : '/api/admin/recipe-categories';
      const method = editingCategory ? 'PUT' : 'POST';
      const body = editingCategory 
        ? { id: editingCategory.id, ...formData }
        : formData;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        toast.success(editingCategory ? 'Категория обновлена' : 'Категория создана');
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: '', slug: '', description: '' });
        fetchCategories();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Ошибка');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Удалить категорию?')) return;
    
    try {
      const res = await fetch(`/api/admin/recipe-categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Категория удалена');
        fetchCategories();
      }
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^а-яёa-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  if (loading || isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>📂 Категории рецептов</h1>
        <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}>
          <Plus size={18} /> Добавить категорию
        </button>
      </div>

      <div className={styles.categoriesList}>
        {categories.length === 0 ? (
          <div className={styles.empty}>
            <p>Нет категорий</p>
            <span>Создайте первую категорию для рецептов</span>
          </div>
        ) : (
          categories.map(category => (
            <div key={category.id} className={styles.categoryCard}>
              <div className={styles.categoryInfo}>
                <div>
                  <div className={styles.categoryName}>{category.name}</div>
                  <div className={styles.categorySlug}>{category.slug}</div>
                  {category.description && (
                    <div className={styles.categoryDesc}>{category.description}</div>
                  )}
                </div>
              </div>
              <div className={styles.categoryActions}>
                <button
                  onClick={() => {
                    setEditingCategory(category);
                    setFormData({
                      name: category.name,
                      slug: category.slug,
                      description: category.description || ''
                    });
                    setIsModalOpen(true);
                  }}
                  className={styles.editBtn}
                  title="Редактировать"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => deleteCategory(category.id)}
                  className={styles.deleteBtn}
                  title="Удалить"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Модальное окно */}
      {isModalOpen && (
        <div className={styles.modal} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingCategory ? 'Редактировать' : 'Добавить'} категорию</h2>
              <button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>Название *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    name: e.target.value,
                    slug: generateSlug(e.target.value)
                  })}
                  placeholder="Например: Дагестанская кухня"
                  required
                />
              </div>
              <div className={styles.field}>
                <label>Slug (URL)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="dagestan"
                />
                <p className={styles.hint}>Оставьте пустым для автоматической генерации</p>
              </div>
              <div className={styles.field}>
                <label>Описание</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Традиционные дагестанские блюда"
                  rows={2}
                />
              </div>
              <div className={styles.modalButtons}>
                <button type="submit" className={styles.saveBtn}>
                  {editingCategory ? 'Сохранить' : 'Добавить'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}