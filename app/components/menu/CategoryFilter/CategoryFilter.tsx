'use client';

import { useState, useEffect } from 'react';
import styles from './CategoryFilter.module.scss';

interface Category {
  id: number;
  name: string;
  slug: string;
}

// Временные данные, потом заменим на API
const mockCategories: Category[] = [
  { id: 1, name: 'Все', slug: 'all' },
  { id: 2, name: 'Пицца', slug: 'pizza' },
  { id: 3, name: 'Чуду', slug: 'chudu' },
  { id: 4, name: 'Мясо на углях', slug: 'grill' },
  { id: 5, name: 'Горячие блюда', slug: 'hot' },
  { id: 6, name: 'Салаты', slug: 'salads' },
  { id: 7, name: 'Напитки', slug: 'drinks' },
];

interface CategoryFilterProps {
  onCategoryChange: (category: string) => void;
  activeCategory: string;
}

export default function CategoryFilter({ onCategoryChange, activeCategory }: CategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // TODO: заменить на реальный API запрос
    setCategories(mockCategories);
  }, []);

  return (
    <div className={styles.filter}>
      <div className={styles.scrollWrapper}>
        <div className={styles.buttons}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.slug)}
              className={`${styles.categoryBtn} ${activeCategory === cat.slug ? styles.active : ''}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}