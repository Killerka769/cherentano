'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, Clock, Users, Phone, CheckCircle, XCircle, 
  Clock as ClockIcon, AlertCircle, Filter, Search, RefreshCw,
  User, Mail, MessageSquare, Trash2, Bell, Store
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface Table {
  id: number;
  number: number;
  seats: number;
}

interface Booking {
  id: string;
  tableId: number;
  table: Table;
  userId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  date: string;
  time: string;
  endTime: string | null;
  guests: number;
  comment: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  createdAt: string;
  confirmedBy: string | null;
  orderId?: number | null;
  user?: { name: string; email: string };
}

const statusConfig: Record<string, { label: string; color: string; icon: any; actions: string[] }> = {
  PENDING: { label: '⏳ Ожидает', color: '#ff9800', icon: <ClockIcon size={14} />, actions: ['CONFIRMED', 'CANCELLED'] },
  CONFIRMED: { label: '✅ Подтверждено', color: '#4caf50', icon: <CheckCircle size={14} />, actions: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] },
  CANCELLED: { label: '❌ Отменено', color: '#f44336', icon: <XCircle size={14} />, actions: [] },
  COMPLETED: { label: '🎉 Посещено', color: '#2196f3', icon: <CheckCircle size={14} />, actions: [] },
  NO_SHOW: { label: '⚠️ Не пришли', color: '#9e9e9e', icon: <XCircle size={14} />, actions: [] }
};

export default function ManagerBookingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, completed: 0 });
  const [showNotification, setShowNotification] = useState(false);
  const [newBookingsCount, setNewBookingsCount] = useState(0);

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN'))) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && (user.role === 'MANAGER' || user.role === 'ADMIN')) {
      fetchBookings();
      // Автообновление каждые 30 секунд
      const interval = setInterval(fetchBookings, 30000);
      return () => clearInterval(interval);
    }
  }, [user, selectedDate, statusFilter]);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchQuery]);

  const fetchBookings = async () => {
    try {
      const res = await fetch(`/api/manager/bookings?date=${selectedDate}&status=${statusFilter}`);
      const data = await res.json();
      const newBookings = data.bookings || [];
      
      // Проверка на новые бронирования
      if (bookings.length > 0) {
        const newCount = newBookings.filter((b: Booking) => 
          !bookings.some((old: Booking) => old.id === b.id) && b.status === 'PENDING'
        ).length;
        if (newCount > 0) {
          setNewBookingsCount(prev => prev + newCount);
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 5000);
        }
      }
      
      setBookings(newBookings);
      updateStats(newBookings);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStats = (bookingsList: Booking[]) => {
    setStats({
      total: bookingsList.length,
      pending: bookingsList.filter(b => b.status === 'PENDING').length,
      confirmed: bookingsList.filter(b => b.status === 'CONFIRMED').length,
      completed: bookingsList.filter(b => b.status === 'COMPLETED').length
    });
  };

  const filterBookings = () => {
    if (!searchQuery.trim()) {
      setFilteredBookings(bookings);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredBookings(bookings.filter(b => 
        b.customerName.toLowerCase().includes(query) ||
        b.customerPhone.includes(query) ||
        b.table.number.toString().includes(query)
      ));
    }
  };

  const updateStatus = async (bookingId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/manager/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status: newStatus })
      });
      
      if (res.ok) {
        toast.success(`Бронирование ${statusConfig[newStatus].label.toLowerCase()}`);
        fetchBookings();
        setSelectedBooking(null);
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
      {/* Уведомление о новых бронях */}
      {showNotification && newBookingsCount > 0 && (
        <div className={styles.notification}>
          <Bell size={18} />
          <span>Новых бронирований: {newBookingsCount}</span>
          <button onClick={() => { setShowNotification(false); setNewBookingsCount(0); fetchBookings(); }}>
            Обновить
          </button>
        </div>
      )}

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Calendar size={28} />
            Управление бронированиями
          </h1>
          <p className={styles.subtitle}>10 уютных кабинок для ваших гостей</p>
        </div>
        <button onClick={fetchBookings} className={styles.refreshBtn}>
          <RefreshCw size={18} />
          Обновить
        </button>
      </div>

      {/* Статистика */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard} style={{ borderLeftColor: '#2196f3' }}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Всего сегодня</div>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: '#ff9800' }}>
          <div className={styles.statValue}>{stats.pending}</div>
          <div className={styles.statLabel}>Ожидают</div>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: '#4caf50' }}>
          <div className={styles.statValue}>{stats.confirmed}</div>
          <div className={styles.statLabel}>Подтверждены</div>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: '#2196f3' }}>
          <div className={styles.statValue}>{stats.completed}</div>
          <div className={styles.statLabel}>Посетили</div>
        </div>
      </div>

      {/* Фильтры */}
      <div className={styles.filters}>
        <div className={styles.dateFilter}>
          <Calendar size={18} />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        
        <div className={styles.statusFilter}>
          <Filter size={18} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Все статусы</option>
            <option value="PENDING">Ожидают</option>
            <option value="CONFIRMED">Подтверждены</option>
            <option value="COMPLETED">Посетили</option>
            <option value="CANCELLED">Отменены</option>
          </select>
        </div>
        
        <div className={styles.searchFilter}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Поиск по имени, телефону, столу..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Список бронирований */}
      <div className={styles.bookingsList}>
        {filteredBookings.length === 0 ? (
          <div className={styles.empty}>
            <Calendar size={48} />
            <p>Нет бронирований на выбранную дату</p>
          </div>
        ) : (
          filteredBookings.map(booking => (
            <div key={booking.id} className={`${styles.bookingCard} ${booking.status === 'PENDING' ? styles.pendingCard : ''}`}>
              <div className={styles.cardHeader}>
              <div className={styles.timeInfo}>
                <span className={styles.time}>
                  {booking.time}
                  {booking.endTime && <span className={styles.timeRange}> — {booking.endTime}</span>}
                </span>
                <span className={styles.table}>Стол №{booking.table.number} ({booking.table.seats} мест)</span>
                <span className={styles.guests}>
                  <Users size={14} />
                  {booking.guests} чел
                </span>
              </div>
                <div 
                  className={styles.status}
                  style={{ background: `${getStatusColor(booking.status)}20`, color: getStatusColor(booking.status) }}
                >
                  {statusConfig[booking.status].icon}
                  {getStatusText(booking.status)}
                </div>
              </div>
              
              <div className={styles.cardBody}>
                <div className={styles.customerInfo}>
                  <div className={styles.customerName}>
                    <User size={16} />
                    {booking.customerName}
                  </div>
                  <div className={styles.customerPhone}>
                    <Phone size={14} />
                    <a href={`tel:${booking.customerPhone}`}>{booking.customerPhone}</a>
                  </div>
                  {booking.customerEmail && (
                    <div className={styles.customerEmail}>
                      <Mail size={14} />
                      {booking.customerEmail}
                    </div>
                  )}
                </div>
                
                {booking.comment && (
                  <div className={styles.comment}>
                    <MessageSquare size={14} />
                    {booking.comment}
                  </div>
                )}
                
                {booking.orderId && (
                  <div className={styles.orderLink}>
                    <Store size={14} />
                    Связан с заказом #{booking.orderId}
                  </div>
                )}
              </div>
              
              <div className={styles.cardFooter}>
                <div className={styles.createdAt}>
                  Забронировано: {new Date(booking.createdAt).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className={styles.actions}>
                  {statusConfig[booking.status]?.actions.map(action => (
                    <button
                      key={action}
                      onClick={() => updateStatus(booking.id, action)}
                      className={styles.actionBtn}
                      style={{ background: getStatusColor(action), color: 'white' }}
                    >
                      {action === 'CONFIRMED' && <CheckCircle size={14} />}
                      {action === 'CANCELLED' && <XCircle size={14} />}
                      {action === 'COMPLETED' && '✓ Посетили'}
                      {action === 'NO_SHOW' && '✗ Не пришли'}
                      {action === 'CONFIRMED' && 'Подтвердить'}
                      {action === 'CANCELLED' && 'Отменить'}
                    </button>
                  ))}
                  <button 
                    onClick={() => setSelectedBooking(booking)}
                    className={styles.detailBtn}
                  >
                    Детали
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Модальное окно с деталями */}
      {selectedBooking && (
        <div className={styles.modal} onClick={() => setSelectedBooking(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Детали бронирования</h3>
              <button onClick={() => setSelectedBooking(null)} className={styles.closeBtn}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailRow}>
                <strong>Клиент:</strong> {selectedBooking.customerName}
              </div>
              <div className={styles.detailRow}>
                <strong>Телефон:</strong> <a href={`tel:${selectedBooking.customerPhone}`}>{selectedBooking.customerPhone}</a>
              </div>
              {selectedBooking.customerEmail && (
                <div className={styles.detailRow}>
                  <strong>Email:</strong> {selectedBooking.customerEmail}
                </div>
              )}
              <div className={styles.detailRow}>
                <strong>Столик:</strong> №{selectedBooking.table.number} ({selectedBooking.table.seats} мест)
              </div>
              <div className={styles.detailRow}>
                <strong>Дата и время:</strong> {new Date(selectedBooking.date).toLocaleDateString('ru-RU')} в {selectedBooking.time}
              </div>
              <div className={styles.detailRow}>
                <strong>Гостей:</strong> {selectedBooking.guests} чел
              </div>
              {selectedBooking.comment && (
                <div className={styles.detailRow}>
                  <strong>Комментарий:</strong> {selectedBooking.comment}
                </div>
              )}
              {selectedBooking.orderId && (
                <div className={styles.detailRow}>
                  <strong>Связан с заказом:</strong> #{selectedBooking.orderId}
                </div>
              )}
              <div className={styles.detailRow}>
                <strong>Забронировано:</strong> {new Date(selectedBooking.createdAt).toLocaleString('ru-RU')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}