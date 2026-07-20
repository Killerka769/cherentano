'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Phone, CheckCircle, Clock, Truck, Check, X, Eye, AlertCircle, Utensils, Store, Heart, Search } from 'lucide-react';
import toast from 'react-hot-toast';
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
  isCharity?: boolean;
  createdAt: string;
  items: { dishName: string; quantity: number; price: number }[];
  statusLogs?: { status: string; comment: string | null; createdAt: string; user?: { name: string } }[];
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
  const [cancelModal, setCancelModal] = useState<{ order: Order; status: string } | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  
  // Поиск и фильтры
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

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
  }, [user]);

  const fetchOrders = async () => {
    const res = await fetch('/api/manager/orders?limit=50');
    const data = await res.json();
    setOrders(data.orders || []);
  };

  const updateStatus = async (orderId: number, newStatus: string, reason?: string) => {
    const res = await fetch('/api/manager/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        orderId, 
        status: newStatus,
        reason: reason || undefined
      })
    });
    
    if (res.ok) {
      toast.success(`Статус заказа #${orderId} обновлен`);
      fetchOrders();
      setSelectedOrder(null);
      setCallModal(null);
      setCancelModal(null);
      setCancelReason('');
    } else {
      const error = await res.json();
      toast.error(error.error || 'Ошибка обновления');
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

  const getOrderTypeLabel = (order: Order) => {
    if (order.isCharity) {
      return { icon: Heart, label: 'Благотворительность', color: '#e91e63' };
    }
    if (order.orderType === 'PICKUP') {
      return { icon: Store, label: 'Самовывоз', color: '#ff9800' };
    }
    return { icon: Truck, label: 'Доставка', color: '#2196f3' };
  };

  // Фильтрация заказов
  const filteredOrders = (ordersList: Order[]) => {
    return ordersList.filter(order => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        String(order.id).includes(searchQuery) ||
        order.customerName.toLowerCase().includes(searchLower) ||
        order.customerPhone.includes(searchQuery) ||
        (order.deliveryAddress && order.deliveryAddress.toLowerCase().includes(searchLower));

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      const matchesType = typeFilter === 'all' || 
        (typeFilter === 'pickup' && order.orderType === 'PICKUP' && !order.isCharity) ||
        (typeFilter === 'delivery' && order.orderType === 'DELIVERY' && !order.isCharity) ||
        (typeFilter === 'charity' && order.isCharity);

      return matchesSearch && matchesStatus && matchesType;
    });
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const currentStepIndex = getStatusStepIndex(order.status);
    const typeInfo = getOrderTypeLabel(order);
    const TypeIcon = typeInfo.icon;
    
    return (
      <div className={styles.orderCard}>
        <div className={styles.cardHeader}>
          <div>
            <span className={styles.orderId}>Заказ #{order.id}</span>
            <span className={styles.orderTime}>
              {new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className={styles.orderTypeBadge} style={{ background: typeInfo.color + '20', color: typeInfo.color }}>
              <TypeIcon size={12} />
              {typeInfo.label}
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
              {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && order.status !== 'REJECTED' && (
                <button 
                  onClick={() => setCancelModal({ order, status: 'CANCELLED' })} 
                  className={styles.cancelBtn}
                  title="Отменить заказ"
                >
                  ❌
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filteredActive = filteredOrders(activeOrders);
  const filteredCompleted = filteredOrders(completedOrders);

  if (loading) return <div className={styles.loader}>Загрузка...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🍕 Панель менеджера</h1>
        <div className={styles.stats}>
          <span className={styles.newCount}>🆕 Новых: {orders.filter(o => o.status === 'NEW').length}</span>
          <span className={styles.progressCount}>⏳ В работе: {activeOrders.length}</span>
          <span className={styles.pickupCount}>🏠 Самовывоз: {orders.filter(o => o.orderType === 'PICKUP' && !o.isCharity).length}</span>
          <span className={styles.deliveryCount}>🚚 Доставка: {orders.filter(o => o.orderType === 'DELIVERY' && !o.isCharity).length}</span>
          {orders.filter(o => o.isCharity).length > 0 && (
            <span className={styles.charityCount}>❤️ Благотв: {orders.filter(o => o.isCharity).length}</span>
          )}
        </div>
      </div>

      {/* Поиск и фильтры */}
      <div className={styles.filtersSection}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Поиск по номеру, имени, телефону или адресу..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className={styles.clearBtn}>
              ✕
            </button>
          )}
        </div>
        
        <div className={styles.filters}>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Все статусы</option>
            <option value="NEW">Новые</option>
            <option value="CALLED">Позвонили</option>
            <option value="CONFIRMED">Подтверждены</option>
            <option value="PREPARING">Готовятся</option>
            <option value="READY">Готовы</option>
            <option value="DELIVERING">В пути</option>
            <option value="COMPLETED">Выполнены</option>
            <option value="CANCELLED">Отменены</option>
          </select>
          
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Все типы</option>
            <option value="pickup">🏠 Самовывоз</option>
            <option value="delivery">🚚 Доставка</option>
            <option value="charity">❤️ Благотворительность</option>
          </select>
        </div>
      </div>

      <div className={styles.tabs}>
        <button onClick={() => setActiveTab('active')} className={activeTab === 'active' ? styles.active : ''}>
          Активные ({filteredActive.length})
        </button>
        <button onClick={() => setActiveTab('completed')} className={activeTab === 'completed' ? styles.active : ''}>
          Завершенные ({filteredCompleted.length})
        </button>
      </div>

      <div className={styles.ordersList}>
        {activeTab === 'active' ? (
          filteredActive.length === 0 ? (
            <div className={styles.empty}>Нет активных заказов</div>
          ) : (
            filteredActive.map(order => <OrderCard key={order.id} order={order} />)
          )
        ) : (
          filteredCompleted.length === 0 ? (
            <div className={styles.empty}>Нет завершенных заказов</div>
          ) : (
            filteredCompleted.map(order => <OrderCard key={order.id} order={order} />)
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
              <p><strong>Тип заказа:</strong> {callModal.isCharity ? '❤️ Благотворительность' : callModal.orderType === 'PICKUP' ? '🏠 Самовывоз' : '🚚 Доставка'}</p>
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
              <button onClick={() => setCancelModal({ order: callModal, status: 'CANCELLED' })} className={styles.rejectBtn}>
                Отменить заказ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка отмены с причиной */}
      {cancelModal && (
        <div className={styles.modal} onClick={() => setCancelModal(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.cancelHeader}>
              <AlertCircle size={24} className={styles.cancelIcon} />
              <h3>Отмена заказа #{cancelModal.order.id}</h3>
            </div>
            <p className={styles.cancelDescription}>
              Укажите причину отмены заказа:
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Например: Нет в наличии ингредиентов, клиент не отвечает, ошибка в заказе..."
              rows={4}
              className={styles.reasonInput}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button 
                onClick={() => {
                  if (!cancelReason.trim()) {
                    toast.error('Укажите причину отмены');
                    return;
                  }
                  updateStatus(cancelModal.order.id, cancelModal.status, cancelReason);
                }} 
                className={styles.confirmCancelBtn}
              >
                ❌ Отменить заказ
              </button>
              <button onClick={() => setCancelModal(null)} className={styles.cancelBtn}>
                Отмена
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
                <p>
                  {selectedOrder.isCharity ? (
                    <span className={styles.charityBadge}>❤️ Благотворительность</span>
                  ) : selectedOrder.orderType === 'PICKUP' ? (
                    <span className={styles.pickupBadge}>🏠 Самовывоз</span>
                  ) : (
                    <span className={styles.deliveryBadge}>🚚 Доставка</span>
                  )}
                </p>
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

              {selectedOrder.statusLogs && selectedOrder.statusLogs.length > 0 && (
                <div className={styles.detailSection}>
                  <h4>История статусов</h4>
                  <div className={styles.statusHistory}>
                    {selectedOrder.statusLogs.map((log, idx) => (
                      <div key={idx} className={styles.statusLogItem}>
                        <span className={styles.logStatus}>
                          {statusSteps.find(s => s.key === log.status)?.label || log.status}
                        </span>
                        <span className={styles.logDate}>
                          {new Date(log.createdAt).toLocaleString('ru-RU')}
                        </span>
                        {log.comment && (
                          <div className={styles.logComment}>
                            <strong>Причина:</strong> {log.comment}
                            {log.user && <span> (изменил: {log.user.name})</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}