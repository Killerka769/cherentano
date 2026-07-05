'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, User, Eye, MessageCircle, Clock, ChefHat } from 'lucide-react';
import ImageWithFallback from '@/app/components/ui/ImageWithFallback/ImageWithFallback';
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
  imageUrl: string | null;
  author: string;
  views: number;
  cookingTime: number | null;
  servings: number | null;
  publishedAt: string;
  category: Category;
  _count: { comments: number };
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecipes();
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, currentPage, searchQuery]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/recipes/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchRecipes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/recipes?category=${selectedCategory}&search=${encodeURIComponent(searchQuery)}&page=${currentPage}&limit=9`
      );
      const data = await res.json();
      setRecipes(data.recipes || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Рецепты</h1>
        <p className={styles.subtitle}>
          Секреты дагестанской и европейской кухни от наших шеф-поваров
        </p>
      </div>

      <div className={styles.categories}>
        <button
          onClick={() => setSelectedCategory('all')}
          className={`${styles.categoryBtn} ${selectedCategory === 'all' ? styles.active : ''}`}
        >
          Все
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.slug)}
            className={`${styles.categoryBtn} ${selectedCategory === cat.slug ? styles.active : ''}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className={styles.loader}>Загрузка...</div>
      ) : recipes.length === 0 ? (
        <div className={styles.empty}>Рецепты не найдены</div>
      ) : (
        <>
          <div className={styles.grid}>
            {recipes.map(recipe => (
              <Link key={recipe.id} href={`/recipes/${recipe.slug}`} className={styles.card}>
                <div className={styles.image}>
                  <ImageWithFallback
                    src={recipe.imageUrl || ''}
                    alt={recipe.title}
                    className={styles.image}
                    fallback="dish"
                  />
                  <span className={styles.category}>{recipe.category.name}</span>
                </div>
                <div className={styles.content}>
                  <h2>{recipe.title}</h2>
                  <p>{recipe.excerpt}</p>
                  <div className={styles.meta}>
                    {recipe.cookingTime && (
                      <span><Clock size={14} /> {recipe.cookingTime} мин</span>
                    )}
                    {recipe.servings && (
                      <span><ChefHat size={14} /> {recipe.servings} порции</span>
                    )}
                    <span><Eye size={14} /> {recipe.views}</span>
                    <span><MessageCircle size={14} /> {recipe._count.comments}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={styles.pageBtn}
              >
                ← Назад
              </button>
              <span>Страница {currentPage} из {totalPages}</span>
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
  );
}