'use client';

import { useState, useEffect } from 'react';
import { Heart, Clock, CheckCircle, XCircle, AlertCircle, MapPin, User } from 'lucide-react';
import Link from 'next/link';
import styles from './UserHelpRequests.module.scss';

interface HelpRequest {
  id: string;
  beneficiaryId: string;
  beneficiary: {
    name: string;
    address: string;
    imageUrl: string | null;
  };
  mealTime: string;
  total: number;
  status: string;
  statusComment: string | null;
  createdAt: string;
  deliveredAt: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: '⏳ Ожидает', color: '#ff9800', icon: Clock },
  APPROVED: { label: '✅ Одобрено', color: '#2196f3', icon: CheckCircle },
  PREPARING: { label: '🍳 Готовится', color: '#ff9800', icon: Clock },
  DELIVERING: { label: '🚚 В пути', color: '#9c27b0', icon: Clock },
  COMPLETED: { label: '🎉 Доставлено', color: '#4caf50', icon: CheckCircle },
  REJECTED: { label: '❌ Отклонено', color: '#f44336', icon: XCircle }
};

const mealLabels: Record<string, string> = {
  BREAKFAST: '🌅 Завтрак',
  LUNCH: '☀️ Обед',
  DINNER: '🌙 Ужин'
};

export default function UserHelpRequests() {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/charity/requests');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to fetch help requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className={styles.empty}>
        <Heart size={48} />
        <h3>Вы ещё не помогали</h3>
        <p>Помогите нуждающимся — это просто!</p>
        <Link href="/charity" className={styles.goBtn}>
          Перейти в раздел помощи
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {requests.map(request => {
        const status = statusConfig[request.status];
        const StatusIcon = status?.icon || AlertCircle;
        
        return (
          <div key={request.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <span className={styles.mealBadge}>{mealLabels[request.mealTime] || request.mealTime}</span>
                <span 
                  className={styles.statusBadge}
                  style={{ background: `${status?.color}20`, color: status?.color }}
                >
                  <StatusIcon size={14} />
                  {status?.label || request.status}
                </span>
              </div>
              <div className={styles.cardDate}>
                {new Date(request.createdAt).toLocaleDateString('ru-RU')}
              </div>
            </div>
            
            <div className={styles.cardBody}>
              <div className={styles.beneficiaryInfo}>
                <div className={styles.beneficiaryName}>
                  <User size={16} />
                  {request.beneficiary.name}
                </div>
                <div className={styles.beneficiaryAddress}>
                  <MapPin size={14} />
                  {request.beneficiary.address}
                </div>
              </div>
              <div className={styles.cardTotal}>
                Сумма: <strong>{request.total} ₽</strong>
              </div>
            </div>
            
            {request.statusComment && (
              <div className={styles.comment}>
                <AlertCircle size={14} />
                {request.statusComment}
              </div>
            )}
            
            <div className={styles.cardFooter}>
              <Link 
                href={`/charity/${request.beneficiaryId}`}
                className={styles.viewLink}
              >
                Посмотреть профиль
              </Link>
              {request.status === 'COMPLETED' && request.deliveredAt && (
                <span className={styles.delivered}>
                  ✅ Доставлено {new Date(request.deliveredAt).toLocaleDateString('ru-RU')}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}