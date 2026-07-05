'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Search, Trash2, Percent, User, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface DiscountUsage {
  id: number;
  discountId: number;
  userId: string;
  discountValue: number;
  createdAt: string;
  discount: {
    code: string;
    name: string;
    type: string;
    value: number;
  };
  user: {
    name: string | null;
    email: string;
    phone: string;
  };
  order: {
    id: number;
    total: number;
  };
}

export default function AdminUserDiscountsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [usages, setUsages] = useState<DiscountUsage[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchUsages();
    }
  }, [user, search]);

  const fetchUsages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/discounts/usages?search=${encodeURIComponent(search)}`);
      if (!res.ok) {
        throw new Error('Ошибка загрузки');
      }
      const data = await res.json();
      setUsages(data.usages || []);
    } catch (error) {
      console.error('Failed to fetch discount usages:', error);
      toast.error('Ошибка загрузки использований скидок');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUsage = async (id: number) => {
    if (!confirm('Удалить запись об использовании скидки?')) return;
    
    try {
      const res = await fetch(`/api/admin/discounts/usages?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Запись удалена');
        fetchUsages();
      } else {
        toast.error('Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  if (loading || isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>📊 Использование скидок</h1>
      </div>

      <div className={styles.searchBox}>
        <Search size={18} />
        <input
          type="text"
          placeholder="Поиск по пользователю, email, телефону..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Пользователь</th>
              <th>Скидка</th>
              <th>Сумма</th>
              <th>Заказ</th>
              <th>Дата</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {usages.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.empty}>
                  <Percent size={48} />
                  <p>Нет использований скидок</p>
                </td>
              </tr>
            ) : (
              usages.map(usage => (
                <tr key={usage.id}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.avatar}>
                        {usage.user.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div>{usage.user.name || 'Без имени'}</div>
                        <div className={styles.contact}>{usage.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.discountCell}>
                      <Percent size={14} />
                      <div>
                        <div>{usage.discount.name}</div>
                        <div className={styles.code}>{usage.discount.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className={styles.amount}>{usage.discountValue} ₽</td>
                  <td>
                    <Link href={`/admin/orders/${usage.order.id}`} className={styles.orderLink}>
                      Заказ #{usage.order.id}
                    </Link>
                  </td>
                  <td>
                    <div className={styles.dateCell}>
                      <Calendar size={14} />
                      {new Date(usage.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </td>
                  <td>
                    <button onClick={() => deleteUsage(usage.id)} className={styles.deleteBtn}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}