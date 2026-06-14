'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Phone, CheckCircle, Clock, Truck, Check, X, Eye } from 'lucide-react';
import styles from './page.module.scss';

interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  comment?: string;
  total: number;
  status: string;
  orderType: string;
  createdAt: string;
  items: { dishName: string; quantity: number; price: number }[];
}

const statusSteps = [
  { key: 'NEW', label: 'Новый', icon: Clock, color: '#ff9800', action: 'call' },
  { key: 'CALLED', label: 'Позвонили', icon: Phone, color: '#2196f3', action: 'confirm' },
  { key: 'CONFIRMED', label: 'Подтвержден', icon: CheckCircle, color: '#4caf50', action: 'cook' },
  { key: 'PREPARING', label: 'Готовится', icon: Clock, color: '#ff9800', action: 'ready' },
  { key: 'READY', label: 'Готов', icon: Check, color: '#9c27b0', action: 'deliver' },
  { key: 'DELIVERING', label: 'В пути', icon: Truck, color: '#2196f3', action: 'complete' },
  { key: 'COMPLETED', label: 'Выполнен', icon: CheckCircle, color: '#4caf50', action: null }
];

export default function ManagerOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [callModal, setCallModal] = useState<Order | null>(null);

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN'))) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && (user.role === 'MANAGER' || user.role === 'ADMIN')) {
      fetchOrders();
      // Автообновление каждые 10 секунд
      const interval = setInterval(fetchOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchOrders = async () => {
    const res = await fetch('/api/manager/orders?limit=50');
    const data = await res.json();
    setOrders(data.orders || []);
  };

  const updateStatus = async (orderId: number, newStatus: string) => {
    const res = await fetch('/api/manager/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status: newStatus })
    });
    
    if (res.ok) {
      fetchOrders();
      setSelectedOrder(null);
      setCallModal(null);
    }
  };

  const getNextAction = (currentStatus: string) => {
    const step = statusSteps.find(s => s.key === currentStatus);
    return step?.action;
  };

  const activeOrders = orders.filter(o => 
    !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(o.status)
  );
  const completedOrders = orders.filter(o => 
    ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(o.status)
  );

  const getStatusStepIndex = (status: string) => {
    return statusSteps.findIndex(s => s.key === status);
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const currentStepIndex = getStatusStepIndex(order.status);
    
    return (
      <div className={styles.orderCard}>
        <div className={styles.cardHeader}>
          <div>
            <span className={styles.orderId}>Заказ #{order.id}</span>
            <span className={styles.orderTime}>
              {new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <span className={`${styles.orderStatus} ${styles[order.status.toLowerCase()]}`}>
            {statusSteps.find(s => s.key === order.status)?.label}
          </span>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.customerInfo}>
            <strong>{order.customerName}</strong>
            <a href={`tel:${order.customerPhone}`} className={styles.phoneLink}>
              <Phone size={14} /> {order.customerPhone}
            </a>
          </div>
          
          <div className={styles.orderSummary}>
            {order.items.slice(0, 2).map((item, idx) => (
              <div key={idx}>{item.dishName} x{item.quantity}</div>
            ))}
            {order.items.length > 2 && <div>+ ещё {order.items.length - 2}</div>}
          </div>
          
          <div className={styles.cardFooter}>
            <div className={styles.total}>{order.total} ₽</div>
            <div className={styles.actions}>
              <button onClick={() => setSelectedOrder(order)} className={styles.detailBtn}>
                <Eye size={16} />
              </button>
              {getNextAction(order.status) && (
                <button
                  onClick={() => {
                    if (getNextAction(order.status) === 'call') {
                      setCallModal(order);
                    } else {
                      const nextStep = statusSteps[currentStepIndex + 1];
                      if (nextStep) updateStatus(order.id, nextStep.key);
                    }
                  }}
                  className={styles.actionBtn}
                >
                  {getNextAction(order.status) === 'call' ? '📞 Позвонить' : '➡️ Далее'}
                </button>
              )}
              {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                <button onClick={() => updateStatus(order.id, 'CANCELLED')} className={styles.cancelBtn}>
                  ❌
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className={styles.loader}>Загрузка...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🍕 Панель менеджера</h1>
        <div className={styles.stats}>
          <span className={styles.newCount}>🆕 Новых: {orders.filter(o => o.status === 'NEW').length}</span>
          <span className={styles.progressCount}>⏳ В работе: {activeOrders.length}</span>
        </div>
      </div>

      <div className={styles.tabs}>
        <button onClick={() => setActiveTab('active')} className={activeTab === 'active' ? styles.active : ''}>
          Активные ({activeOrders.length})
        </button>
        <button onClick={() => setActiveTab('completed')} className={activeTab === 'completed' ? styles.active : ''}>
          Завершенные
        </button>
      </div>

      <div className={styles.ordersList}>
        {activeTab === 'active' ? (
          activeOrders.length === 0 ? (
            <div className={styles.empty}>Нет активных заказов</div>
          ) : (
            activeOrders.map(order => <OrderCard key={order.id} order={order} />)
          )
        ) : (
          completedOrders.length === 0 ? (
            <div className={styles.empty}>Нет завершенных заказов</div>
          ) : (
            completedOrders.map(order => <OrderCard key={order.id} order={order} />)
          )
        )}
      </div>

      {/* Модалка звонка */}
      {callModal && (
        <div className={styles.modal} onClick={() => setCallModal(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3>📞 Свяжитесь с клиентом</h3>
            <div className={styles.callInfo}>
              <p><strong>Клиент:</strong> {callModal.customerName}</p>
              <p><strong>Телефон:</strong> <a href={`tel:${callModal.customerPhone}`}>{callModal.customerPhone}</a></p>
              {callModal.orderType === 'DELIVERY' && callModal.deliveryAddress && (
                <p><strong>Адрес:</strong> {callModal.deliveryAddress}</p>
              )}
              {callModal.comment && (
                <p><strong>Комментарий:</strong> {callModal.comment}</p>
              )}
            </div>
            <div className={styles.modalActions}>
              <a href={`tel:${callModal.customerPhone}`} className={styles.callBtn}>
                <Phone size={18} /> Позвонить
              </a>
              <button onClick={() => updateStatus(callModal.id, 'CALLED')} className={styles.confirmCallBtn}>
                Подтвердить звонок
              </button>
              <button onClick={() => updateStatus(callModal.id, 'CANCELLED')} className={styles.rejectBtn}>
                Отменить заказ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка деталей заказа */}
      {selectedOrder && (
        <div className={styles.modal} onClick={() => setSelectedOrder(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Заказ #{selectedOrder.id}</h3>
              <button onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <div className={styles.orderDetails}>
              <div className={styles.detailSection}>
                <h4>Информация о клиенте</h4>
                <p>👤 {selectedOrder.customerName}</p>
                <p>📞 <a href={`tel:${selectedOrder.customerPhone}`}>{selectedOrder.customerPhone}</a></p>
                {selectedOrder.orderType === 'DELIVERY' && selectedOrder.deliveryAddress && (
                  <p>📍 {selectedOrder.deliveryAddress}</p>
                )}
              </div>
              
              <div className={styles.detailSection}>
                <h4>Состав заказа</h4>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className={styles.detailItem}>
                    <span>{item.dishName} x{item.quantity}</span>
                    <span>{item.price * item.quantity} ₽</span>
                  </div>
                ))}
                <div className={styles.detailTotal}>Итого: {selectedOrder.total} ₽</div>
              </div>
              
              {selectedOrder.comment && (
                <div className={styles.detailSection}>
                  <h4>Комментарий</h4>
                  <p>{selectedOrder.comment}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}