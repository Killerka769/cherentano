'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import styles from './page.module.scss';

interface Category {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
}

export default function AdminCategoriesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });

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
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data.categories || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const url = editingCategory 
      ? `/api/admin/categories?id=${editingCategory.id}`
      : '/api/categories';
    
    const method = editingCategory ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        slug: formData.slug || formData.name.toLowerCase().replace(/ /g, '-')
      })
    });
    
    if (res.ok) {
      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', slug: '' });
      fetchCategories();
    }
  };

  const deleteCategory = async (id: number) => {
    if (confirm('Удалить категорию? Блюда в ней останутся без категории.')) {
      await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
      fetchCategories();
    }
  };

  if (loading) return <div className={styles.loader}>Загрузка...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Управление категориями</h1>
        <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}>
          <Plus size={18} /> Добавить категорию
        </button>
      </div>

      <div className={styles.categoriesList}>
        {categories.map((cat, index) => (
          <div key={cat.id} className={styles.categoryCard}>
            <div className={styles.categoryInfo}>
              <span className={styles.categoryNumber}>{index + 1}</span>
              <div>
                <div className={styles.categoryName}>{cat.name}</div>
                <div className={styles.categorySlug}>{cat.slug}</div>
              </div>
            </div>
            <div className={styles.categoryActions}>
              <button onClick={() => {
                setEditingCategory(cat);
                setFormData({ name: cat.name, slug: cat.slug });
                setIsModalOpen(true);
              }} className={styles.editBtn}>
                <Edit2 size={16} />
              </button>
              <button onClick={() => deleteCategory(cat.id)} className={styles.deleteBtn}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className={styles.modal} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2>{editingCategory ? 'Редактировать' : 'Добавить'} категорию</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Название категории"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Slug (англ.)"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
              <div className={styles.modalButtons}>
                <button type="submit" className={styles.saveBtn}>Сохранить</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}