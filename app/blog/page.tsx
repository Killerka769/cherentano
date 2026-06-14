'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, User, Eye, MessageCircle, Search, ChevronRight } from 'lucide-react';
import styles from './page.module.scss';
import ImageWithFallback from '../components/ui/ImageWithFallback/ImageWithFallback';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  imageUrl: string | null;
  author: string;
  views: number;
  publishedAt: string;
  category: Category;
  _count: { comments: number };
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
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
      fetchPosts();
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, currentPage, searchQuery]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/blog/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/blog/posts?category=${selectedCategory}&search=${encodeURIComponent(searchQuery)}&page=${currentPage}&limit=9`
      );
      const data = await res.json();
      setPosts(data.posts || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Блог ресторана</h1>
        <p className={styles.subtitle}>
          Новости, события, истории наших гостей и секреты дагестанской кухни
        </p>
      </div>

      {/* Поиск */}
      <div className={styles.searchSection}>
        <div className={styles.searchBox}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Поиск по статьям..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Категории */}
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

      {/* Сетка статей */}
      {isLoading ? (
        <div className={styles.loader}>Загрузка...</div>
      ) : posts.length === 0 ? (
        <div className={styles.empty}>
          <p>Статьи не найдены</p>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {posts.map(post => (
              <article key={post.id} className={styles.card}>
                <Link href={`/blog/${post.slug}`} className={styles.cardLink}>
                  <div className={styles.image}>
                    <ImageWithFallback
                      src={post.imageUrl || ''}
                      alt={post.title}
                      className={styles.image}
                      fallback="blog"
                    />
                    <span className={styles.category}>{post.category.name}</span>
                  </div>
                  <div className={styles.content}>
                    <h2 className={styles.postTitle}>{post.title}</h2>
                    <p className={styles.excerpt}>{post.excerpt}</p>
                    <div className={styles.meta}>
                      <span className={styles.date}>
                        <Calendar size={14} />
                        {new Date(post.publishedAt).toLocaleDateString('ru-RU')}
                      </span>
                      <span className={styles.author}>
                        <User size={14} />
                        {post.author}
                      </span>
                      <span className={styles.views}>
                        <Eye size={14} />
                        {post.views}
                      </span>
                      <span className={styles.comments}>
                        <MessageCircle size={14} />
                        {post._count.comments}
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
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
              <span className={styles.pageInfo}>
                Страница {currentPage} из {totalPages}
              </span>
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