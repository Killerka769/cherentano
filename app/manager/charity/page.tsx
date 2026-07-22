'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Heart, Clock, CheckCircle, XCircle, AlertCircle, 
  MapPin, User, Filter, RefreshCw, MessageSquare,
  Send, X, Phone, Calendar, Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface HelpRequest {
  id: string;
  beneficiaryId: string;
  userId: string;
  mealTime: string;
  total: number;
  status: string;
  statusComment: string | null;
  createdAt: string;
  deliveredAt: string | null;
  items: any[];
  comment: string | null;
  user: { name: string; phone: string } | null;
  beneficiary: {
    id: string;
    name: string;
    address: string;
    phone: string | null;
    needs: string;
    urgency: string;
    imageUrl: string | null;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: any; actions: string[] }> = {
  NEW: {
    label: '🆕 Новый', 
    color: '#ff9800', 
    icon: Clock,
    actions: ['APPROVED', 'REJECTED']
  },
  PENDING: { 
    label: '⏳ Ожидает', 
    color: '#ff9800', 
    icon: Clock,
    actions: ['APPROVED', 'REJECTED']
  },
  APPROVED: { 
    label: '✅ Одобрено', 
    color: '#2196f3', 
    icon: CheckCircle,
    actions: ['PREPARING', 'CANCELLED', 'REJECTED']
  },
  PREPARING: { 
    label: '🍳 Готовится', 
    color: '#ff9800', 
    icon: Clock,
    actions: ['DELIVERING']
  },
  DELIVERING: { 
    label: '🚚 В пути', 
    color: '#9c27b0', 
    icon: Clock,
    actions: ['COMPLETED']
  },
  COMPLETED: { 
    label: '🎉 Доставлено', 
    color: '#4caf50', 
    icon: CheckCircle,
    actions: []
  },
  REJECTED: { 
    label: '❌ Отклонено', 
    color: '#f44336', 
    icon: XCircle,
    actions: []
  }
};

const mealLabels: Record<string, string> = {
  BREAKFAST: '🌅 Завтрак',
  LUNCH: '☀️ Обед',
  DINNER: '🌙 Ужин'
};

export default function ManagerCharityPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [statusComment, setStatusComment] = useState('');

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN'))) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && (user.role === 'MANAGER' || user.role === 'ADMIN')) {
      fetchRequests();
      const interval = setInterval(fetchRequests, 30000);
      return () => clearInterval(interval);
    }
  }, [user, filter]);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`/api/manager/charity/requests?status=${filter}`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to fetch charity requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (requestId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/manager/charity/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId, 
          status: newStatus,
          comment: statusComment 
        })
      });
      
      if (res.ok) {
        toast.success(`Статус обновлён`);
        setStatusComment('');
        setSelectedRequest(null);
        fetchRequests();
      } else {
        toast.error('Ошибка обновления');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  const getStatusText = (status: string) => {
    return statusConfig[status]?.label || status;
  };

  const getStatusColor = (status: string) => {
    return statusConfig[status]?.color || '#9e9e9e';
  };

  if (loading || isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Heart size={28} />
            Заявки на помощь
          </h1>
          <p className={styles.subtitle}>Управляйте заявками на благотворительность</p>
        </div>
        <button onClick={fetchRequests} className={styles.refreshBtn}>
          <RefreshCw size={18} />
          Обновить
        </button>
      </div>

      <div className={styles.filters}>
        <button onClick={() => setFilter('all')} className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}>
          Все ({requests.length})
        </button>
        <button onClick={() => setFilter('PENDING')} className={`${styles.filterBtn} ${filter === 'PENDING' ? styles.active : ''}`}>
          ⏳ Ожидают ({requests.filter(r => r.status === 'PENDING').length})
        </button>
        <button onClick={() => setFilter('APPROVED')} className={`${styles.filterBtn} ${filter === 'APPROVED' ? styles.active : ''}`}>
          ✅ Одобрены ({requests.filter(r => r.status === 'APPROVED').length})
        </button>
        <button onClick={() => setFilter('DELIVERING')} className={`${styles.filterBtn} ${filter === 'DELIVERING' ? styles.active : ''}`}>
          🚚 В пути ({requests.filter(r => r.status === 'DELIVERING').length})
        </button>
        <button onClick={() => setFilter('COMPLETED')} className={`${styles.filterBtn} ${filter === 'COMPLETED' ? styles.active : ''}`}>
          🎉 Доставлены ({requests.filter(r => r.status === 'COMPLETED').length})
        </button>
      </div>

      <div className={styles.requestsList}>
        {requests.length === 0 ? (
          <div className={styles.empty}>
            <Heart size={48} />
            <p>Нет заявок на помощь</p>
          </div>
        ) : (
          requests.map(request => {
            const status = statusConfig[request.status];
            const StatusIcon = status?.icon || AlertCircle;
            
            return (
              <div 
                key={request.id} 
                className={`${styles.requestCard} ${request.status === 'PENDING' ? styles.pending : ''}`}
                onClick={() => setSelectedRequest(request)}
              >
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
                
                <div className={styles.cardFooter}>
                  <span className={styles.urgencyBadge}>
                    {request.beneficiary.urgency}
                  </span>
                  <span className={styles.userInfo}>
                    👤 {request.user?.name || 'Аноним'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Модальное окно для управления заявкой */}
      {selectedRequest && (
        <div className={styles.modal} onClick={() => setSelectedRequest(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Заявка на помощь</h3>
              <button onClick={() => setSelectedRequest(null)} className={styles.closeBtn}>✕</button>
            </div>
            
            <div className={styles.modalBody}>
              {/* Информация о нуждающемся */}
              <div className={styles.detailSection}>
                <h4>👤 Информация о нуждающемся</h4>
                <div className={styles.detailRow}>
                  <strong>Имя:</strong> {selectedRequest.beneficiary.name}
                </div>
                <div className={styles.detailRow}>
                  <strong>Адрес:</strong> {selectedRequest.beneficiary.address}
                </div>
                <div className={styles.detailRow}>
                  <strong>Телефон:</strong> 
                  <a href={`tel:${selectedRequest.beneficiary.phone}`} className={styles.phoneLink}>
                    {selectedRequest.beneficiary.phone || 'Не указан'}
                  </a>
                </div>
                <div className={styles.detailRow}>
                  <strong>Нуждается:</strong> {selectedRequest.beneficiary.needs}
                </div>
                <div className={styles.detailRow}>
                  <strong>Срочность:</strong>
                  <span 
                    className={styles.urgencyBadge}
                    style={{ 
                      background: selectedRequest.beneficiary.urgency === 'Критический' ? '#f44336' : 
                                 selectedRequest.beneficiary.urgency === 'Срочный' ? '#ff9800' : '#4caf50',
                      color: 'white',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      display: 'inline-block'
                    }}
                  >
                    {selectedRequest.beneficiary.urgency}
                  </span>
                </div>
              </div>

              {/* Информация о заявке */}
              <div className={styles.detailSection}>
                <h4>🍽️ Информация о заявке</h4>
                <div className={styles.detailRow}>
                  <strong>Приём пищи:</strong> {mealLabels[selectedRequest.mealTime] || selectedRequest.mealTime}
                </div>
                <div className={styles.detailRow}>
                  <strong>Сумма:</strong> <span className={styles.amount}>{selectedRequest.total} ₽</span>
                </div>
                <div className={styles.detailRow}>
                  <strong>Статус:</strong>
                  <span style={{ color: getStatusColor(selectedRequest.status) }}>
                    {getStatusText(selectedRequest.status)}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <strong>Создана:</strong> 
                  <span className={styles.dateTime}>
                    <Calendar size={14} />
                    {new Date(selectedRequest.createdAt).toLocaleString('ru-RU')}
                  </span>
                </div>
                {selectedRequest.deliveredAt && (
                  <div className={styles.detailRow}>
                    <strong>Доставлена:</strong>
                    <span className={styles.dateTime}>
                      <Calendar size={14} />
                      {new Date(selectedRequest.deliveredAt).toLocaleString('ru-RU')}
                    </span>
                  </div>
                )}
              </div>

              {/* Информация о помощнике */}
              <div className={styles.detailSection}>
                <h4>👤 Информация о помощнике</h4>
                <div className={styles.detailRow}>
                  <strong>Имя:</strong> {selectedRequest.user?.name || 'Аноним'}
                </div>
                <div className={styles.detailRow}>
                  <strong>Телефон:</strong> 
                  <a href={`tel:${selectedRequest.user?.phone}`} className={styles.phoneLink}>
                    {selectedRequest.user?.phone || 'Не указан'}
                  </a>
                </div>
              </div>

              {/* Состав помощи */}
              {selectedRequest.items && selectedRequest.items.length > 0 && (
                <div className={styles.detailSection}>
                  <h4>🛒 Состав помощи</h4>
                  <div className={styles.itemsList}>
                    {selectedRequest.items.map((item: any, index: number) => (
                      <div key={index} className={styles.itemRow}>
                        <span>{item.name} x{item.quantity}</span>
                        <span>{item.price * item.quantity} ₽</span>
                      </div>
                    ))}
                    <div className={styles.itemTotal}>
                      <strong>Итого:</strong> {selectedRequest.total} ₽
                    </div>
                  </div>
                </div>
              )}

              {/* Комментарии */}
              {selectedRequest.comment && (
                <div className={styles.detailSection}>
                  <h4>💬 Комментарий пользователя</h4>
                  <p className={styles.commentText}>{selectedRequest.comment}</p>
                </div>
              )}

              {selectedRequest.statusComment && (
                <div className={styles.detailSection}>
                  <h4>📝 Комментарий менеджера</h4>
                  <p className={styles.commentText}>{selectedRequest.statusComment}</p>
                </div>
              )}

              {/* Управление статусом */}
              <div className={styles.statusActions}>
                <h4>⚡ Изменить статус</h4>
                <div className={styles.statusButtons}>
                  {statusConfig[selectedRequest.status]?.actions.map(action => {
                    const actionConfig = statusConfig[action];
                    return (
                      <button
                        key={action}
                        onClick={() => updateStatus(selectedRequest.id, action)}
                        className={styles.statusBtn}
                        style={{ background: actionConfig?.color, color: 'white' }}
                      >
                        {actionConfig?.icon && <actionConfig.icon size={14} />}
                        {actionConfig?.label || action}
                      </button>
                    );
                  })}
                </div>
                <textarea
                  placeholder="Комментарий к изменению статуса (опционально)"
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  rows={2}
                  className={styles.commentInput}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}