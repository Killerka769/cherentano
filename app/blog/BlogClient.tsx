'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, User, Eye, MessageCircle, Search } from 'lucide-react';
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

interface BlogClientProps {
  initialPosts: BlogPost[];
  initialCategories: Category[];
  initialTotalPages: number;
}

export default function BlogClient({ 
  initialPosts, 
  initialCategories, 
  initialTotalPages 
}: BlogClientProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [categories] = useState<Category[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);

  const fetchPosts = async (category: string, search: string, page: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        category,
        search,
        page: String(page),
        limit: '9'
      });
      const res = await fetch(`/api/blog/posts?${params}`);
      const data = await res.json();
      setPosts(data.posts || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    setCurrentPage(1);
    fetchPosts(categorySlug, searchQuery, 1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setCurrentPage(1);
    fetchPosts(selectedCategory, value, 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchPosts(selectedCategory, searchQuery, page);
  };

  if (isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

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
            onChange={handleSearchChange}
          />
        </div>
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

      {/* Сетка статей */}
      {posts.length === 0 ? (
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
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={styles.pageBtn}
              >
                ← Назад
              </button>
              <span className={styles.pageInfo}>
                Страница {currentPage} из {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
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