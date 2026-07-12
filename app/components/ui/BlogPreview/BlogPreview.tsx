'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, User, Eye, MessageCircle, ArrowRight, 
  Clock, ChevronRight, Sparkles, TrendingUp, BookOpen 
} from 'lucide-react';
import ImageWithFallback from '@/app/components/ui/ImageWithFallback/ImageWithFallback';
import { motion } from 'framer-motion';
import styles from './BlogPreview.module.scss';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  imageUrl: string | null;
  author: string;
  views: number;
  publishedAt: string;
  category: { name: string; slug: string };
  _count: { comments: number };
}

export default function BlogPreview() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecentPosts();
  }, []);

  const fetchRecentPosts = async () => {
    try {
      // Изменено с limit=3 на limit=6
      const res = await fetch('/api/blog/posts?limit=6');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to fetch blog posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.skeletonHeader}>
            <div className={styles.skeletonBadge}></div>
            <div className={styles.skeletonTitle}></div>
            <div className={styles.skeletonSubtitle}></div>
          </div>
          <div className={styles.grid}>
            {/* Показываем 6 скелетонов */}
            {[...Array(6)].map((_, i) => (
              <div key={i} className={styles.skeletonCard}></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      {/* Декоративный фон */}
      <div className={styles.bgDecor}>
        <div className={styles.bgBlur1}></div>
        <div className={styles.bgBlur2}></div>
        <div className={styles.bgBlur3}></div>
      </div>

      <div className={styles.container}>
        {/* Заголовок */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className={styles.badgeWrapper}
            >
              <span className={styles.badge}>
                <BookOpen size={20} />
                Блог ресторана
              </span>
              <span className={styles.badgeTrend}>
                <TrendingUp size={18} />
                Новое
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className={styles.mainTitle}
            >
              Последние статьи
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className={styles.subtitle}
            >
              Узнайте последние новости, события и секреты дагестанской кухни
            </motion.p>
          </div>
        </div>

        {/* Сетка статей - теперь 6 карточек */}
        <div className={styles.grid}>
          {posts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={styles.card}
            >
              <Link href={`/blog/${post.slug}`} className={styles.cardLink}>
                <div className={styles.imageWrapper}>
                  <ImageWithFallback
                    src={post.imageUrl || ''}
                    alt={post.title}
                    className={styles.image}
                    fallback="blog"
                  />
                  <div className={styles.imageOverlay}>
                    <span className={styles.readBadge}>
                      <Eye size={16} />
                      {post.views} просмотров
                    </span>
                  </div>
                  <span className={styles.categoryBadge}>
                    {post.category.name}
                  </span>
                </div>

                <div className={styles.content}>
                  <div className={styles.contentTop}>
                    <h3 className={styles.cardTitle}>{post.title}</h3>
                    <p className={styles.excerpt}>{post.excerpt}</p>
                  </div>

                  <div className={styles.footer}>
                    <div className={styles.meta}>
                      <span>
                        <User size={16} />
                        {post.author}
                      </span>
                      <span>
                        <Calendar size={16} />
                        {new Date(post.publishedAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className={styles.stats}>
                      <span className={styles.stat}>
                        <MessageCircle size={16} />
                        {post._count.comments}
                      </span>
                      <span className={styles.stat}>
                        <Eye size={16} />
                        {post.views}
                      </span>
                    </div>
                  </div>

                  <div className={styles.readMore}>
                    <span>Читать статью</span>
                    <ChevronRight size={20} />
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        {/* Бонусный блок - изменен на светлый фон */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className={styles.bonusBlock}
        >
          <div className={styles.bonusIcon}>📖</div>
          <div className={styles.bonusContent}>
            <h4>Хотите узнать больше?</h4>
            <p>В нашем блоге мы делимся рецептами, историями и секретами дагестанской кухни</p>
          </div>
          <Link href="/blog" className={styles.bonusBtn}>
            Перейти в блог
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}