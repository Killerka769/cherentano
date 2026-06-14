'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Download, FileSpreadsheet, Eye, Phone } from 'lucide-react';
import styles from './page.module.scss';

interface OrderItem {
  dishName: string;
  quantity: number;
  price: number;
}

interface StatusLog {
  status: string;
  comment: string | null;
  createdAt: string;
}

interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string | null;
  comment?: string | null;
  total: number;
  status: string;
  orderType: string;
  createdAt: string;
  items: OrderItem[];
  statusLogs: StatusLog[];
  assignedManager: { name: string } | null;
  user?: {
    id: string;
    name: string;
    phone: string;
    email: string;
    phoneVerified: boolean;
  } | null;
}

const statusConfig: Record<string, { label: string; color: string; nextStatuses: string[] }> = {
  NEW: { label: '🆕 Новый', color: '#2196f3', nextStatuses: ['CALLED', 'CANCELLED'] },
  CALLED: { label: '📞 Позвонили', color: '#ff9800', nextStatuses: ['CONFIRMED', 'REJECTED'] },
  CONFIRMED: { label: '✅ Подтвержден', color: '#4caf50', nextStatuses: ['PREPARING', 'CANCELLED'] },
  PREPARING: { label: '🍳 Готовится', color: '#ff9800', nextStatuses: ['READY'] },
  READY: { label: '📦 Готов', color: '#9c27b0', nextStatuses: ['DELIVERING', 'COMPLETED'] },
  DELIVERING: { label: '🚚 В пути', color: '#2196f3', nextStatuses: ['COMPLETED'] },
  COMPLETED: { label: '✅ Выполнен', color: '#4caf50', nextStatuses: [] },
  CANCELLED: { label: '❌ Отменен', color: '#f44336', nextStatuses: [] },
  REJECTED: { label: '⚠️ Отклонен', color: '#f44336', nextStatuses: [] }
};

export default function AdminOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [comment, setComment] = useState('');
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportFormat, setExportFormat] = useState('csv');

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN'))) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && (user.role === 'MANAGER' || user.role === 'ADMIN')) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [user, filter]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/manager/orders?status=${filter}&limit=100`);
      const data = await res.json();
      setOrders(data.orders || []);
      setStats(data.stats || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const updateStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await fetch('/api/manager/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus, comment })
      });
      
      if (res.ok) {
        setComment('');
        fetchOrders();
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    params.append('format', exportFormat);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (filter !== 'all') params.append('status', filter);
    
    window.open(`/api/admin/export?${params.toString()}`, '_blank');
    setShowExportModal(false);
  };

  const getStatusCount = (status: string) => {
    const stat = stats.find(s => s.status === status);
    return stat?._count || 0;
  };

  const getStatusText = (status: string) => {
    return statusConfig[status]?.label || status;
  };

  if (loading) return <div className={styles.loader}>Загрузка...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Управление заказами</h1>
        <button onClick={() => setShowExportModal(true)} className={styles.exportBtn}>
          <Download size={18} />
          Экспорт
        </button>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{getStatusCount('NEW')}</span>
          <span className={styles.statLabel}>🆕 Новые</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{getStatusCount('CALLED')}</span>
          <span className={styles.statLabel}>📞 На звонке</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{getStatusCount('PREPARING')}</span>
          <span className={styles.statLabel}>🍳 Готовятся</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{getStatusCount('DELIVERING')}</span>
          <span className={styles.statLabel}>🚚 В пути</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{getStatusCount('COMPLETED')}</span>
          <span className={styles.statLabel}>✅ Выполнены</span>
        </div>
      </div>

      <div className={styles.filters}>
        <button onClick={() => setFilter('all')} className={filter === 'all' ? styles.active : ''}>
          Все ({orders.length})
        </button>
        <button onClick={() => setFilter('NEW')} className={filter === 'NEW' ? styles.active : ''}>
          🆕 Новые ({getStatusCount('NEW')})
        </button>
        <button onClick={() => setFilter('CALLED')} className={filter === 'CALLED' ? styles.active : ''}>
          📞 Позвонили ({getStatusCount('CALLED')})
        </button>
        <button onClick={() => setFilter('CONFIRMED')} className={filter === 'CONFIRMED' ? styles.active : ''}>
          ✅ Подтвержденные ({getStatusCount('CONFIRMED')})
        </button>
        <button onClick={() => setFilter('PREPARING')} className={filter === 'PREPARING' ? styles.active : ''}>
          🍳 Готовятся ({getStatusCount('PREPARING')})
        </button>
        <button onClick={() => setFilter('DELIVERING')} className={filter === 'DELIVERING' ? styles.active : ''}>
          🚚 В пути ({getStatusCount('DELIVERING')})
        </button>
        <button onClick={() => setFilter('COMPLETED')} className={filter === 'COMPLETED' ? styles.active : ''}>
          ✅ Выполненные ({getStatusCount('COMPLETED')})
        </button>
      </div>

      <div className={styles.ordersGrid}>
        {orders.map(order => (
          <div key={order.id} className={styles.orderCard} onClick={() => setSelectedOrder(order)}>
            <div className={styles.orderHeader}>
              <div>
                <span className={styles.orderId}>Заказ #{order.id}</span>
                <span className={styles.orderTime}>
                  {new Date(order.createdAt).toLocaleString('ru-RU')}
                </span>
              </div>
              <span 
                className={styles.orderStatus}
                style={{ background: statusConfig[order.status]?.color + '20', color: statusConfig[order.status]?.color }}
              >
                {getStatusText(order.status)}
              </span>
            </div>
            
            <div className={styles.orderInfo}>
              <div><strong>{order.customerName}</strong></div>
              <div>{order.customerPhone}</div>
              <div>{order.orderType === 'PICKUP' ? '🏠 Самовывоз' : '🚚 Доставка'}</div>
            </div>
            
            <div className={styles.orderItems}>
              {order.items.slice(0, 3).map((item, idx) => (
                <div key={idx}>{item.dishName} x{item.quantity}</div>
              ))}
              {order.items.length > 3 && <div>+ ещё {order.items.length - 3}</div>}
            </div>
            
            <div className={styles.orderFooter}>
              <div className={styles.orderTotal}>{order.total} ₽</div>
              <div className={styles.orderActions}>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }} 
                  className={styles.detailBtn}
                  title="Детали"
                >
                  <Eye size={16} />
                </button>
                <a 
                  href={`tel:${order.customerPhone}`} 
                  className={styles.callBtn}
                  onClick={(e) => e.stopPropagation()}
                  title="Позвонить"
                >
                  <Phone size={14} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className={styles.empty}>
          <p>Нет заказов в выбранной категории</p>
        </div>
      )}

      {/* Модальное окно для управления заказом */}
      {selectedOrder && (
        <div className={styles.modal} onClick={() => setSelectedOrder(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Заказ #{selectedOrder.id}</h2>
              <button onClick={() => setSelectedOrder(null)} className={styles.closeBtn}>✕</button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.customerInfo}>
                <h3>📋 Информация о клиенте</h3>
                <p><strong>Имя:</strong> {selectedOrder.customerName}</p>
                <p><strong>Телефон:</strong> <a href={`tel:${selectedOrder.customerPhone}`}>{selectedOrder.customerPhone}</a></p>
                {selectedOrder.user && (
                  <p>
                    <strong>Верификация:</strong>
                    {selectedOrder.user.phoneVerified ? (
                      <span className={styles.verified}> ✅ Подтвержден</span>
                    ) : (
                      <span className={styles.unverified}> ⏳ Будет подтвержден после выполнения заказа</span>
                    )}
                  </p>
                )}
                {selectedOrder.orderType === 'DELIVERY' && selectedOrder.deliveryAddress && (
                  <p><strong>Адрес:</strong> {selectedOrder.deliveryAddress}</p>
                )}
                {selectedOrder.comment && (
                  <p><strong>Комментарий:</strong> {selectedOrder.comment}</p>
                )}
              </div>
              
              <div className={styles.orderDetails}>
                <h3>🛒 Состав заказа</h3>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className={styles.orderItemDetail}>
                    <span>{item.dishName} x{item.quantity}</span>
                    <span>{item.price * item.quantity} ₽</span>
                  </div>
                ))}
                <div className={styles.orderTotalDetail}>
                  <strong>Итого:</strong> <strong className={styles.totalAmount}>{selectedOrder.total} ₽</strong>
                </div>
              </div>
              
              <div className={styles.statusHistory}>
                <h3>📜 История статусов</h3>
                {selectedOrder.statusLogs?.map((log, idx) => (
                  <div key={idx} className={styles.statusLog}>
                    <span className={styles.logStatus}>{getStatusText(log.status)}</span>
                    <span className={styles.logTime}>{new Date(log.createdAt).toLocaleString('ru-RU')}</span>
                    {log.comment && <span className={styles.logComment}>📝 {log.comment}</span>}
                  </div>
                ))}
                {(!selectedOrder.statusLogs || selectedOrder.statusLogs.length === 0) && (
                  <div className={styles.noLogs}>Нет истории изменений</div>
                )}
              </div>
              
              <div className={styles.statusActions}>
                <h3>⚡ Изменить статус</h3>
                <div className={styles.statusButtons}>
                  {statusConfig[selectedOrder.status]?.nextStatuses.map(nextStatus => (
                    <button
                      key={nextStatus}
                      onClick={() => updateStatus(selectedOrder.id, nextStatus)}
                      className={styles.statusBtn}
                      style={{ background: statusConfig[nextStatus]?.color, color: 'white' }}
                    >
                      {statusConfig[nextStatus]?.label}
                    </button>
                  ))}
                  {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'COMPLETED' && selectedOrder.status !== 'REJECTED' && (
                    <button
                      onClick={() => updateStatus(selectedOrder.id, 'CANCELLED')}
                      className={`${styles.statusBtn} ${styles.danger}`}
                    >
                      ❌ Отменить заказ
                    </button>
                  )}
                </div>
                <textarea
                  placeholder="Комментарий к изменению статуса (опционально)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className={styles.commentInput}
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно экспорта */}
      {showExportModal && (
        <div className={styles.modal} onClick={() => setShowExportModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>📊 Экспорт заказов</h3>
              <button onClick={() => setShowExportModal(false)} className={styles.closeBtn}>✕</button>
            </div>
            <div className={styles.exportForm}>
              <div className={styles.exportField}>
                <label>Формат файла:</label>
                <select value={exportFormat} onChange={e => setExportFormat(e.target.value)}>
                  <option value="csv">📄 CSV (Excel, Google Sheets)</option>
                  <option value="xlsx">📊 Excel XLSX</option>
                </select>
              </div>
              <div className={styles.exportField}>
                <label>Дата от:</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className={styles.exportField}>
                <label>Дата до:</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <div className={styles.modalButtons}>
                <button onClick={handleExport} className={styles.saveBtn}>
                  <FileSpreadsheet size={16} /> Экспортировать
                </button>
                <button onClick={() => setShowExportModal(false)} className={styles.cancelBtn}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}