'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Calendar, Plus, Trash2, Utensils, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
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
  category: { id: number; name: string; slug: string };
}

interface WeeklyMenuItem {
  id: number;
  date: string;
  dishId: number;
  dish: Dish;
}

const DAYS = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

export default function AdminWeeklyMenuPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<Record<string, WeeklyMenuItem[]>>({});
  const [weekDays, setWeekDays] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDishIds, setSelectedDishIds] = useState<Set<number>>(new Set());
  const [targetDate, setTargetDate] = useState<string>('');
  const [availableDishes, setAvailableDishes] = useState<Dish[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      generateWeekDays();
      fetchWeeklyMenu();
      fetchAvailableDishes();
      fetchCategories();
    }
  }, [user, weekOffset]);

  const generateWeekDays = () => {
    const today = new Date();
    // Обнуляем время локально
    today.setHours(0, 0, 0, 0);
    
    // Сдвигаем на нужную неделю
    today.setDate(today.getDate() + weekOffset * 7);
    
    const day = today.getDay();
    // Находим понедельник этой недели
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diff);
    
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const dayStr = String(date.getDate()).padStart(2, '0');
      // Формируем чистую строку YYYY-MM-DD БЕЗ использования .toISOString()
      days.push(`${year}-${month}-${dayStr}`);
    }
    setWeekDays(days);
    
    const currentToday = new Date();
    const todayStr = `${currentToday.getFullYear()}-${String(currentToday.getMonth() + 1).padStart(2, '0')}-${String(currentToday.getDate()).padStart(2, '0')}`;
    
    if (weekOffset === 0 && days.includes(todayStr)) {
      setSelectedDay(todayStr);
    } else {
      setSelectedDay(days[0]);
    }

    return days;
  };

  const fetchWeeklyMenu = async (currentWeekDays?: string[]) => {
    setIsLoading(true);
    try {
      const activeDays = Array.isArray(currentWeekDays) ? currentWeekDays : weekDays;
      // В качестве стартовой даты бэкенду отправляем строго понедельник (первый элемент массива)
      const startDateStr = activeDays.length > 0 ? activeDays[0] : new Date().toLocaleDateString('en-CA');
      
      const res = await fetch(`/api/weekly-menu?startDate=${startDateStr}`);
      const data = await res.json();
      
      console.log('📥 Weekly menu response:', data);
      setMenuItems(data.menu || {});
    } catch (error) {
      console.error('Failed to fetch weekly menu:', error);
      toast.error('Ошибка загрузки меню');
    } finally {
      setIsLoading(false);
    }
  };

  const getDayName = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
  };

  const isToday = (dateStr: string) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return dateStr === todayStr;
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchAvailableDishes = async () => {
    try {
      const res = await fetch('/api/admin/dishes');
      const data = await res.json();
      setAvailableDishes(data.dishes || []);
    } catch (error) {
      console.error('Failed to fetch dishes:', error);
    }
  };

  const handleAddDishes = async () => {
    if (selectedDishIds.size === 0) {
      toast.error('Выберите хотя бы одно блюдо');
      return;
    }

    if (!targetDate) {
      toast.error('Выберите дату');
      return;
    }

    setIsAdding(true);

    try {
      const dishIdsArray = Array.from(selectedDishIds);
      
      console.log('📤 Sending:', { date: targetDate, dishIds: dishIdsArray });
      
      const res = await fetch('/api/weekly-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: targetDate,
          dishIds: dishIdsArray
        })
      });

      const data = await res.json();
      console.log('📥 Response:', data);

      if (res.ok) {
        toast.success(`Добавлено ${data.addedCount || dishIdsArray.length} блюд в меню`);
        setShowAddModal(false);
        setSelectedDishIds(new Set());
        setTargetDate('');
        await fetchWeeklyMenu();
        await fetchAvailableDishes();
      } else {
        toast.error(data.error || 'Ошибка добавления');
      }
    } catch (error) {
      console.error('Error adding dishes:', error);
      toast.error('Ошибка соединения');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveDish = async (id: number) => {
    if (!confirm('Удалить блюдо из меню?')) return;

    try {
      const res = await fetch(`/api/weekly-menu?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Блюдо удалено из меню');
        await fetchWeeklyMenu();
        await fetchAvailableDishes();
      }
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  const toggleDishSelection = (dishId: number) => {
    const newSet = new Set(selectedDishIds);
    if (newSet.has(dishId)) {
      newSet.delete(dishId);
    } else {
      newSet.add(dishId);
    }
    setSelectedDishIds(newSet);
  };

  const toggleAllDishes = () => {
    if (selectedDishIds.size === filteredDishes.length && filteredDishes.length > 0) {
      setSelectedDishIds(new Set());
    } else {
      setSelectedDishIds(new Set(filteredDishes.map(d => d.id)));
    }
  };

  const filteredDishes = availableDishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          dish.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || dish.category?.slug === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Проверяем, какие блюда уже в меню на выбранный день
  const existingDishIds = new Set(
    (selectedDay ? menuItems[selectedDay] || [] : []).map(item => item.dishId)
  );

  const currentDishes = selectedDay ? menuItems[selectedDay] || [] : [];

  if (loading || isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <Calendar size={28} />
          Меню на неделю
        </h1>
        <div className={styles.headerActions}>
          <button  className={styles.refreshBtn}>
            Обновить
          </button>
        </div>
      </div>

      <div className={styles.navigation}>
        <button onClick={() => setWeekOffset(prev => prev - 1)} className={styles.navBtn}>
          <ChevronLeft size={20} />
        </button>
        <span className={styles.weekLabel}>
          {weekOffset === 0 ? 'Текущая неделя' : weekOffset > 0 ? `+${weekOffset} неделя` : `${weekOffset} неделя`}
        </span>
        <button onClick={() => setWeekOffset(0)} className={styles.todayBtn}>Сегодня</button>
        <button onClick={() => setWeekOffset(prev => prev + 1)} className={styles.navBtn}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div className={styles.daysNav}>
        {weekDays.map(day => {
          const dayMenu = menuItems[day] || [];
          const today = isToday(day);
          
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`${styles.dayBtn} ${selectedDay === day ? styles.active : ''} ${today ? styles.today : ''}`}
            >
              <span className={styles.dayDate}>{getDayName(day)}</span>
              <span className={styles.dishCount}>
                {dayMenu.length > 0 ? `${dayMenu.length} блюд` : 'пусто'}
              </span>
              {today && <span className={styles.todayBadge}>Сегодня</span>}
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className={styles.dishesSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <Utensils size={18} />
              Меню на {getDayName(selectedDay)}
            </div>
            <button 
              onClick={() => {
                setTargetDate(selectedDay);
                setShowAddModal(true);
              }} 
              className={styles.addBtn}
            >
              <Plus size={16} />
              Добавить блюда
            </button>
          </div>

          {currentDishes.length === 0 ? (
            <div className={styles.empty}>
              <p>Нет блюд на этот день</p>
              <button 
                onClick={() => {
                  setTargetDate(selectedDay);
                  setShowAddModal(true);
                }} 
                className={styles.emptyAddBtn}
              >
                Добавить блюда
              </button>
            </div>
          ) : (
            <div className={styles.dishesList}>
              {currentDishes.map(item => (
                <div key={item.id} className={styles.dishCard}>
                  <div className={styles.dishInfo}>
                    <div className={styles.dishName}>{item.dish.name}</div>
                    <div className={styles.dishMeta}>
                      <span className={styles.dishCategory}>{item.dish.category?.name}</span>
                      <span className={styles.dishPrice}>{item.dish.price} ₽</span>
                      {item.dish.weight && (
                        <span className={styles.dishWeight}>{item.dish.weight}г</span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveDish(item.id)} 
                    className={styles.removeBtn}
                    title="Удалить из меню"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <div className={styles.modal} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Добавить блюда в меню</h3>
              <button onClick={() => setShowAddModal(false)} className={styles.closeBtn}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalField}>
                <label>Дата меню</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={styles.dateInput}
                />
              </div>

              <div className={styles.modalFilters}>
                <div className={styles.searchBox}>
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Поиск блюд..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className={styles.clearSearchBtn}>
                      <X size={14} />
                    </button>
                  )}
                </div>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={styles.categoryFilter}
                >
                  <option value="all">Все категории</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.dishesGrid}>
                <div className={styles.dishesHeader}>
                  <label className={styles.selectAll}>
                    <input
                      type="checkbox"
                      checked={selectedDishIds.size === filteredDishes.length && filteredDishes.length > 0}
                      onChange={toggleAllDishes}
                    />
                    <span>Выбрать все ({filteredDishes.length})</span>
                  </label>
                  <span className={styles.selectedCount}>
                    Выбрано: {selectedDishIds.size}
                  </span>
                </div>

                <div className={styles.dishesList}>
                  {filteredDishes.map(dish => {
                    const isAlreadyInMenu = existingDishIds.has(dish.id);
                    const isSelected = selectedDishIds.has(dish.id);
                    
                    return (
                      <label 
                        key={dish.id} 
                        className={`${styles.dishItem} ${isSelected ? styles.selected : ''} ${isAlreadyInMenu ? styles.inMenu : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected || isAlreadyInMenu}
                          onChange={() => !isAlreadyInMenu && toggleDishSelection(dish.id)}
                          disabled={isAlreadyInMenu}
                        />
                        <div className={styles.dishItemInfo}>
                          <span className={styles.dishItemName}>{dish.name}</span>
                          <span className={styles.dishItemPrice}>{dish.price} ₽</span>
                          <span className={styles.dishItemCategory}>{dish.category?.name}</span>
                          {isAlreadyInMenu && (
                            <span className={styles.inMenuBadge}>Уже в меню</span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <div className={styles.modalStats}>
                  <span>Выбрано: <strong>{selectedDishIds.size}</strong> блюд</span>
                  <span>Дата: <strong>{targetDate ? new Date(targetDate + 'T00:00:00').toLocaleDateString('ru-RU') : 'не выбрана'}</strong></span>
                </div>
                <div className={styles.modalButtons}>
                  <button 
                    onClick={handleAddDishes} 
                    disabled={isAdding || selectedDishIds.size === 0 || !targetDate}
                    className={styles.saveBtn}
                  >
                    {isAdding ? 'Добавление...' : `Добавить ${selectedDishIds.size} блюд`}
                  </button>
                  <button onClick={() => setShowAddModal(false)} className={styles.cancelBtn}>
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}