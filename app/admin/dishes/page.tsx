'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, StarOff, Calendar, Utensils, Truck, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface Dish {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  weight: number | null;
  isAvailable: boolean;
  categoryId: number;
  menuType: 'DELIVERY' | 'PICKUP' | 'BOTH';
  category: { name: string };
}

interface Category {
  id: number;
  name: string;
}

interface DishOfDay {
  id: number;
  dishId: number;
  date: string;
  dish: Dish;
}

const menuTypeLabels: Record<string, { label: string; icon: any; color: string }> = {
  DELIVERY: { 
    label: '🚚 Доставка', 
    icon: <Truck size={14} />, 
    color: '#2196f3' 
  },
  PICKUP: { 
    label: '🏠 Ресторан', 
    icon: <Utensils size={14} />, 
    color: '#ff9800' 
  },
  BOTH: { 
    label: '🔄 Оба', 
    icon: <span style={{ display: 'flex', gap: '4px' }}><Utensils size={12} /><Truck size={12} /></span>, 
    color: '#4caf50' 
  }
};

export default function AdminDishesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishesOfDay, setDishesOfDay] = useState<DishOfDay[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    weight: '',
    imageUrl: '',
    menuType: 'BOTH'
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Поиск и фильтры
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [menuTypeFilter, setMenuTypeFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchDishes();
      fetchCategories();
      fetchDishesOfDay();
    }
  }, [user, selectedDate]);

  const fetchDishes = async () => {
    try {
      const res = await fetch('/api/admin/dishes');
      const data = await res.json();
      setDishes(data.dishes || []);
    } catch (error) {
      toast.error('Ошибка загрузки блюд');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      toast.error('Ошибка загрузки категорий');
    }
  };

  const fetchDishesOfDay = async () => {
    try {
      const res = await fetch(`/api/admin/dishes/dish-of-day?date=${selectedDate}`);
      const data = await res.json();
      setDishesOfDay(data.dishesOfDay || []);
    } catch (error) {
      console.error('Failed to fetch dishes of day:', error);
    }
  };

  const toggleDishOfDay = async (dishId: number) => {
    const isAlreadyDishOfDay = dishesOfDay.some(d => d.dishId === dishId);
    
    try {
      if (isAlreadyDishOfDay) {
        await fetch(`/api/admin/dishes/dish-of-day?dishId=${dishId}&date=${selectedDate}`, {
          method: 'DELETE'
        });
        toast.success('Блюдо удалено из блюд дня');
      } else {
        const res = await fetch('/api/admin/dishes/dish-of-day', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dishId, date: selectedDate })
        });
        
        if (res.status === 400) {
          const error = await res.json();
          toast.error(error.error);
          return;
        }
        toast.success('Блюдо добавлено в блюда дня!');
      }
      fetchDishesOfDay();
      fetchDishes();
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.categoryId) {
      toast.error('Заполните обязательные поля');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const url = '/api/admin/dishes';
      const method = editingDish ? 'PUT' : 'POST';
      
      const body = editingDish 
        ? { id: editingDish.id, ...formData }
        : formData;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        toast.success(editingDish ? 'Блюдо обновлено' : 'Блюдо добавлено');
        setIsModalOpen(false);
        setEditingDish(null);
        setFormData({ 
          name: '', 
          description: '', 
          price: '', 
          categoryId: '', 
          weight: '', 
          imageUrl: '',
          menuType: 'BOTH'
        });
        fetchDishes();
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

  const toggleAvailability = async (dish: Dish) => {
    try {
      const res = await fetch('/api/admin/dishes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: dish.id,
          name: dish.name,
          description: dish.description,
          price: dish.price,
          categoryId: dish.categoryId,
          imageUrl: dish.imageUrl,
          weight: dish.weight,
          isAvailable: !dish.isAvailable,
          menuType: dish.menuType
        })
      });
      
      if (res.ok) {
        toast.success(dish.isAvailable ? 'Блюдо скрыто' : 'Блюдо опубликовано');
        fetchDishes();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const deleteDish = async (id: number) => {
    if (!confirm('Удалить блюдо?')) return;
    
    try {
      const res = await fetch(`/api/admin/dishes?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Блюдо удалено');
        fetchDishes();
      }
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  // Фильтрация блюд
  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || String(dish.categoryId) === categoryFilter;
    const matchesMenuType = menuTypeFilter === 'all' || dish.menuType === menuTypeFilter;
    const matchesAvailability = availabilityFilter === 'all' || 
      (availabilityFilter === 'available' && dish.isAvailable) ||
      (availabilityFilter === 'unavailable' && !dish.isAvailable);

    return matchesSearch && matchesCategory && matchesMenuType && matchesAvailability;
  });

  if (loading) return <div className={styles.loader}>Загрузка...</div>;

  const dishOfDayIds = dishesOfDay.map(d => d.dishId);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Управление меню</h1>
        <div className={styles.headerActions}>
          <div className={styles.dateSelector}>
            <Calendar size={16} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={styles.dateInput}
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}>
            <Plus size={18} /> Добавить блюдо
          </button>
        </div>
      </div>

      {/* Поиск и фильтры */}
      <div className={styles.filtersSection}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Поиск по названию блюда..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className={styles.clearBtn}>
              ✕
            </button>
          )}
        </div>
        
        <div className={styles.filters}>
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Все категории</option>
            {categories.map(cat => (
              <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
            ))}
          </select>
          
          <select 
            value={menuTypeFilter} 
            onChange={(e) => setMenuTypeFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Все типы</option>
            <option value="BOTH">Оба</option>
            <option value="PICKUP">Ресторан</option>
            <option value="DELIVERY">Доставка</option>
          </select>
          
          <select 
            value={availabilityFilter} 
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Все</option>
            <option value="available">Доступны</option>
            <option value="unavailable">Скрыты</option>
          </select>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Категория</th>
              <th>Цена</th>
              <th>Тип меню</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredDishes.map(dish => {
              const isDishOfDay = dishOfDayIds.includes(dish.id);
              const menuTypeInfo = menuTypeLabels[dish.menuType] || menuTypeLabels.BOTH;
              
              return (
                <tr key={dish.id} className={isDishOfDay ? styles.dishOfDayRow : ''}>
                  <td>{dish.id}</td>
                  <td className={styles.titleCell}>
                    <div className={styles.dishName}>
                      {dish.name}
                      {isDishOfDay && <span className={styles.dishOfDayBadge}>⭐ Блюдо дня</span>}
                    </div>
                    {dish.imageUrl && (
                      <div className={styles.imagePreview}>
                        <img src={dish.imageUrl} alt={dish.name} width={40} height={40} />
                      </div>
                    )}
                  </td>
                  <td>{dish.category?.name || '-'}</td>
                  <td>{dish.price} ₽</td>
                  <td>
                    <span 
                      className={styles.menuTypeBadge}
                      style={{ 
                        background: `${menuTypeInfo.color}20`, 
                        color: menuTypeInfo.color,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 500
                      }}
                    >
                      {menuTypeInfo.icon}
                      {menuTypeInfo.label}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => toggleAvailability(dish)} className={styles.statusBtn}>
                      {dish.isAvailable ? <Eye size={16} /> : <EyeOff size={16} />}
                      {dish.isAvailable ? ' Доступно' : ' Скрыто'}
                    </button>
                  </td>
                  <td className={styles.actions}>
                    <button 
                      onClick={() => toggleDishOfDay(dish.id)} 
                      className={`${styles.dishOfDayBtn} ${isDishOfDay ? styles.active : ''}`}
                      title={isDishOfDay ? 'Убрать из блюд дня' : 'Добавить в блюда дня'}
                    >
                      {isDishOfDay ? <Star size={16} fill="#ffd700" color="#ffd700" /> : <Star size={16} />}
                    </button>
                    <button onClick={() => {
                      setEditingDish(dish);
                      setFormData({
                        name: dish.name,
                        description: dish.description || '',
                        price: String(dish.price),
                        categoryId: String(dish.categoryId),
                        weight: String(dish.weight || ''),
                        imageUrl: dish.imageUrl || '',
                        menuType: dish.menuType || 'BOTH'
                      });
                      setIsModalOpen(true);
                    }} className={styles.editBtn}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteDish(dish.id)} className={styles.deleteBtn}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredDishes.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.emptyRow}>
                  <div className={styles.emptyState}>
                    {searchQuery ? 'Блюда не найдены по вашему запросу' : 'Нет блюд'}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className={styles.modal} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>{editingDish ? 'Редактировать' : 'Добавить'} блюдо</h2>
            <form onSubmit={handleSubmit}>
              <input 
                type="text" 
                placeholder="Название *" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
              />
              <textarea 
                placeholder="Описание" 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                rows={3}
              />
              <input 
                type="number" 
                placeholder="Цена *" 
                value={formData.price} 
                onChange={(e) => setFormData({...formData, price: e.target.value})} 
                required 
              />
              <select 
                value={formData.categoryId} 
                onChange={(e) => setFormData({...formData, categoryId: e.target.value})} 
                required
              >
                <option value="">Выберите категорию</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <input 
                type="number" 
                placeholder="Вес (граммы)" 
                value={formData.weight} 
                onChange={(e) => setFormData({...formData, weight: e.target.value})} 
              />
              <input 
                type="text" 
                placeholder="URL изображения" 
                value={formData.imageUrl} 
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} 
              />
              <div className={styles.field}>
                <label>Тип меню</label>
                <select
                  value={formData.menuType}
                  onChange={(e) => setFormData({ ...formData, menuType: e.target.value })}
                  className={styles.select}
                >
                  <option value="BOTH">🔄 Для ресторана и доставки</option>
                  <option value="PICKUP">🏠 Только для ресторана</option>
                  <option value="DELIVERY">🚚 Только для доставки</option>
                </select>
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
    </div>
  );
}