'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DishCard from '@/app/components/menu/DishCard/DishCard';
import { Heart, ChevronRight, Search, X, History, Utensils, Truck } from 'lucide-react';
import styles from './page.module.scss';
import { MenuGridSkeleton } from '../components/ui/Skeleton/Skeleton';
import Banner from '../components/ui/Banner/Banner';
import DishOfDay from '../components/ui/DishOfDay/DishOfDay';
import LoadIndicator from '../components/ui/LoadIndicator/LoadIndicator';
import WeeklyMenu from '../components/ui/WeeklyMenu/WeeklyMenu';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Dish {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  weight: number | null;
  slug: string;
  isAvailable: boolean;
  menuType: 'DELIVERY' | 'PICKUP' | 'BOTH';
  category: Category;
}

export default function MenuPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [menuType, setMenuType] = useState<'pickup' | 'delivery'>('pickup');

  // Загружаем тип меню из localStorage при монтировании
  useEffect(() => {
    const savedType = localStorage.getItem('selectedMenuType');
    if (savedType === 'delivery' || savedType === 'pickup') {
      setMenuType(savedType);
    } else {
      // По умолчанию - в ресторане
      setMenuType('pickup');
      localStorage.setItem('selectedMenuType', 'pickup');
    }
  }, []);

  // Сохраняем тип в localStorage при изменении
  const handleMenuTypeChange = (type: 'pickup' | 'delivery') => {
    setMenuType(type);
    localStorage.setItem('selectedMenuType', type);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDishes();
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, currentPage, searchQuery, menuType]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchDishes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/dishes?category=${selectedCategory}&search=${encodeURIComponent(searchQuery)}&page=${currentPage}&limit=9&menuType=${menuType}`
      );
      const data = await res.json();
      setDishes(data.dishes || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch dishes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleCategoryChange = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Наше меню</h1>
          <p className={styles.subtitle}>Дагестанская и европейская кухня</p>
        </div>
        <div className={styles.menuTabs}>
          <button className={`${styles.menuTab} ${styles.active}`}>
            <Utensils size={18} /> В ресторане
          </button>
          <button className={styles.menuTab}>
            <Truck size={18} /> Доставка
          </button>
        </div>
        <div className={styles.searchSection}>
          <div className={styles.searchBox}>
            <Search size={20} />
            <input type="text" placeholder="Поиск..." />
          </div>
        </div>
        <div className={styles.categories}>
          <button className={styles.categoryBtn}>Все</button>
        </div>
        <MenuGridSkeleton />
      </div>
    );
  }

  return (
    <>
      <Banner />
    <div className={styles.container}>
      
      
      <div className={styles.header}>
        <h1 className={styles.title}>Наше меню</h1>
        <p className={styles.subtitle}>Дагестанская и европейская кухня</p>
        <div className={styles.loadIndicator}>
          <LoadIndicator showTitle={false} />
        </div>
      </div>

      {/* Вкладки меню - сохраняем выбор */}
      <div className={styles.menuTabs}>
        <button
          onClick={() => handleMenuTypeChange('pickup')}
          className={`${styles.menuTab} ${menuType === 'pickup' ? styles.active : ''}`}
        >
          <Utensils size={18} />
          В ресторане
        </button>
        <button
          onClick={() => handleMenuTypeChange('delivery')}
          className={`${styles.menuTab} ${menuType === 'delivery' ? styles.active : ''}`}
        >
          <Truck size={18} />
          Доставка
        </button>
      </div>

      <WeeklyMenu />
      <DishOfDay />

      {/* Кнопки помощи */}
      <div className={styles.charityLinksWrapper}>
        <Link href="/charity" className={styles.charityLink}>
          <Heart size={18} className={styles.charityLinkIcon} />
          <span>Помочь</span>
        </Link>
        <Link href="/charity/history" className={styles.charityHistoryLink}>
          <History size={16} /> История помощи
        </Link>
      </div>

      {/* Поиск */}
      <div className={styles.searchSection}>
        <div className={styles.searchBox}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Поиск блюд по названию или составу..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button onClick={clearSearch} className={styles.clearBtn}>
              <X size={18} />
            </button>
          )}
        </div>
        {searchQuery && (
          <div className={styles.searchResults}>
            Найдено: {totalItems} {totalItems === 1 ? 'блюдо' : totalItems < 5 ? 'блюда' : 'блюд'}
          </div>
        )}
      </div>

      {/* Категории */}
      <div className={styles.categories}>
        <button
          onClick={() => handleCategoryChange('all')}
          className={`${styles.categoryBtn} ${selectedCategory === 'all' ? styles.active : ''}`}
        >
          Все
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.slug)}
            className={`${styles.categoryBtn} ${selectedCategory === cat.slug ? styles.active : ''}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Результаты */}
      {dishes.length === 0 ? (
        <div className={styles.empty}>
          <p>Ничего не найдено</p>
          <p className={styles.emptyHint}>Попробуйте изменить поисковый запрос или категорию</p>
          <button onClick={clearSearch} className={styles.resetBtn}>
            Сбросить поиск
          </button>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {dishes.map(dish => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={styles.pageBtn}
              >
                ← Назад
              </button>
              <div className={styles.pageNumbers}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`${styles.pageNumber} ${currentPage === page ? styles.active : ''}`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={styles.pageBtn}
              >
                Вперед →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  </>
  );
}