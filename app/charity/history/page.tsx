'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, ArrowLeft, User, Calendar, MapPin } from 'lucide-react';
import ImageWithFallback from '@/app/components/ui/ImageWithFallback/ImageWithFallback';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface HelpHistory {
  id: string;
  beneficiaryId: string;
  userId: string;
  mealTime: string;
  amount: number;
  items: any;
  createdAt: string;
  user: { name: string } | null;
  beneficiary: { 
    name: string; 
    imageUrl: string | null;
    address?: string;
  };
}

const mealLabels: Record<string, string> = {
  BREAKFAST: '🌅 Завтрак',
  LUNCH: '☀️ Обед',
  DINNER: '🌙 Ужин'
};

export default function CharityHistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<HelpHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/charity/history');
      return;
    }
    if (user) {
      fetchHistory();
    }
  }, [user, loading]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/charity/history/all');
      const data = await res.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      toast.error('Ошибка загрузки истории');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/charity" className={styles.backLink}>
          <ArrowLeft size={18} />
          Назад
        </Link>
        <h1 className={styles.title}>
          <Heart size={28} className={styles.titleIcon} />
          Общая история помощи
        </h1>
        <p className={styles.subtitle}>Все добрые дела, совершённые нашими гостями</p>
      </div>

      {history.length === 0 ? (
        <div className={styles.empty}>
          <Heart size={64} />
          <h3>История помощи пока пуста</h3>
          <p>Станьте первым, кто поможет нуждающимся!</p>
          <Link href="/charity" className={styles.goBtn}>
            Перейти к помощи
          </Link>
        </div>
      ) : (
        <div className={styles.historyList}>
          {history.map(item => (
            <div key={item.id} className={styles.historyCard}>
              <div className={styles.historyImage}>
                <ImageWithFallback
                  src={item.beneficiary.imageUrl || ''}
                  alt={item.beneficiary.name}
                  fallback="default"
                />
              </div>
              <div className={styles.historyContent}>
                <div className={styles.historyHeader}>
                  <div>
                    <div className={styles.historyName}>{item.beneficiary.name}</div>
                    <div className={styles.historyMeal}>{mealLabels[item.mealTime] || item.mealTime}</div>
                    {item.beneficiary.address && (
                      <div className={styles.historyAddress}>
                        <MapPin size={12} />
                        {item.beneficiary.address}
                      </div>
                    )}
                  </div>
                  <div className={styles.historyAmount}>{item.amount} ₽</div>
                </div>
                <div className={styles.historyFooter}>
                  <span className={styles.historyHelper}>
                    <User size={14} />
                    {item.user?.name || 'Анонимный помощник'}
                  </span>
                  <span className={styles.historyDate}>
                    <Calendar size={14} />
                    {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                {item.items && item.items.length > 0 && (
                  <div className={styles.historyItems}>
                    {item.items.slice(0, 3).map((product: any, idx: number) => (
                      <span key={idx} className={styles.historyItem}>
                        {product.name} x{product.quantity}
                      </span>
                    ))}
                    {item.items.length > 3 && (
                      <span className={styles.historyMore}>+ ещё {item.items.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}