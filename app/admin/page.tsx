'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, Users, Coins, TrendingUp, 
  Package, Clock, ArrowRight, Pizza, Coffee, 
  Table,
  Settings,
  FileText,
  MessageSquare,
  Text,
  Percent,
  Gift,
  ChefHat,
  Heart
} from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.scss';

interface Stats {
  totalOrders: number;
  todayOrders: number;
  totalUsers: number;
  totalRevenue: number;
  todayRevenue: number;
  ordersByStatus: { status: string; _count: number }[];
  popularDishes: { dishName: string; _sum: { quantity: number } }[];
  recentOrders: any[];
}

const statusLabels: Record<string, string> = {
  NEW: '🆕 Новые',
  CALLED: '📞 Позвонили',
  CONFIRMED: '✅ Подтвержденные',
  PREPARING: '🍳 Готовятся',
  READY: '📦 Готовы',
  DELIVERING: '🚚 В пути',
  COMPLETED: '✅ Выполненные',
  CANCELLED: '❌ Отмененные'
};

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return <div className={styles.loader}>Загрузка дашборда...</div>;
  }

  if (!stats) return null;

  const statusMap = stats.ordersByStatus.reduce((acc, curr) => {
    acc[curr.status] = curr._count;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Панель управления</h1>
        <p className={styles.subtitle}>Добро пожаловать, {user?.name || user?.email}</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#e3f2fd', color: '#2196f3' }}>
            <ShoppingBag size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalOrders}</span>
            <span className={styles.statLabel}>Всего заказов</span>
          </div>
          <div className={styles.statChange}>
            +{stats.todayOrders} сегодня
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#e8f5e9', color: '#4caf50' }}>
            <Coins size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalRevenue.toLocaleString()} ₽</span>
            <span className={styles.statLabel}>Выручка</span>
          </div>
          <div className={styles.statChange}>
            +{stats.todayRevenue.toLocaleString()} ₽ сегодня
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fff3e0', color: '#ff9800' }}>
            <Users size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalUsers}</span>
            <span className={styles.statLabel}>Пользователей</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fce4ec', color: '#e91e63' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>
              {stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0} ₽
            </span>
            <span className={styles.statLabel}>Средний чек</span>
          </div>
        </div>
      </div>

      <div className={styles.twoColumns}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Статусы заказов</h3>
            <Link href="/admin/orders" className={styles.cardLink}>
              Все заказы <ArrowRight size={16} />
            </Link>
          </div>
          <div className={styles.statusList}>
            {Object.entries(statusLabels).map(([status, label]) => (
              <div key={status} className={styles.statusItem}>
                <span>{label}</span>
                <span className={styles.statusCount}>{statusMap[status] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Популярные блюда</h3>
            <Link href="/admin/dishes" className={styles.cardLink}>
              Управление меню <ArrowRight size={16} />
            </Link>
          </div>
          <div className={styles.dishesList}>
            {stats.popularDishes.map((dish, idx) => (
              <div key={idx} className={styles.dishItem}>
                <span>{idx + 1}. {dish.dishName}</span>
                <span>заказано: {dish._sum.quantity} шт.</span>
              </div>
            ))}
            {stats.popularDishes.length === 0 && (
              <div className={styles.empty}>Нет данных</div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3>Последние заказы</h3>
        </div>
        <div className={styles.recentOrders}>
          <table className={styles.table}>
            <thead>
              <tr><th>ID</th><th>Клиент</th><th>Сумма</th><th>Статус</th><th>Время</th></tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.customerName}</td>
                  <td>{order.total} ₽</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[order.status.toLowerCase()]}`}>
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleString('ru-RU')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.quickActions}>
        <h3>Быстрые действия</h3>
        <div className={styles.actionsGrid}>
          <Link href="/admin/blog" className={styles.actionBtn}>
            <FileText size={20} /> Блог
          </Link>
          <Link href="/admin/load-intervals" className={styles.actionBtn}>
            <Clock size={20} /> Загруженность
          </Link>
          <Link href="/admin/banners" className={styles.actionBtn}>
            <Text size={20} /> Баннер
          </Link>
          <Link href="/admin/reviews" className={styles.actionBtn}>
            <MessageSquare size={20} /> Отзывы
          </Link>
          <Link href="/admin/orders" className={styles.actionBtn}>
            <Package size={20} /> Заказы
          </Link>
          <Link href="/admin/dishes" className={styles.actionBtn}>
            <Pizza size={20} /> Меню
          </Link>
          <Link href="/admin/categories" className={styles.actionBtn}>
            <Coffee size={20} /> Категории
          </Link>
          <Link href="/admin/users" className={styles.actionBtn}>
            <Users size={20} /> Пользователи
          </Link>
          <Link href="/admin/tables" className={styles.actionBtn}>
            <Table size={20} /> Столики
          </Link>
          <Link href="/admin/settings" className={styles.actionBtn}>
            <Settings size={20} /> Настройки
          </Link>
          <Link href="/admin/discounts" className={styles.actionBtn}>
            <Percent size={20} /> Скидки
          </Link>
          <Link href="/admin/discounts/users" className={styles.actionBtn}>
            <Users size={20} /> Использование скидок
          </Link>
          <Link href="/admin/recipes" className={styles.actionBtn}>
            <ChefHat size={20} /> Рецепты
          </Link>
          <Link href="/admin/recipes/comments" className={styles.actionBtn}>
            <ChefHat size={20} /> Комментарии к рецептам
          </Link>
          <Link href="/admin/recipes/categories" className={styles.actionBtn}>
            <ChefHat size={20} /> Категории рецептов
          </Link>
          <Link href="/admin/charity" className={styles.actionBtn}>
            <Heart size={20} /> Благотворительность
          </Link>
        </div>
      </div>
    </div>
  );
}