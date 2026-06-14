'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, Users, Phone, MapPin, XCircle, CheckCircle, Clock as ClockIcon, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface Booking {
  id: string;
  tableId: number;
  table: { number: number; seats: number };
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  guests: number;
  comment: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Ожидает подтверждения', color: '#ff9800', icon: <ClockIcon size={14} /> },
  CONFIRMED: { label: 'Подтверждено', color: '#4caf50', icon: <CheckCircle size={14} /> },
  CANCELLED: { label: 'Отменено', color: '#f44336', icon: <XCircle size={14} /> },
  COMPLETED: { label: 'Посещено', color: '#2196f3', icon: <CheckCircle size={14} /> },
  NO_SHOW: { label: 'Не пришли', color: '#9e9e9e', icon: <XCircle size={14} /> }
};

export default function MyBookingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelBooking = async (id: string) => {
    if (!confirm('Отменить бронирование?')) return;
    
    try {
      const res = await fetch('/api/manager/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: id, status: 'CANCELLED' })
      });
      
      if (res.ok) {
        toast.success('Бронирование отменено');
        fetchBookings();
      } else {
        toast.error('Ошибка при отмене');
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
        <Link href="/profile" className={styles.backLink}>
          <ArrowLeft size={20} />
          Назад в профиль
        </Link>
        <h1 className={styles.title}>
          <Calendar size={28} />
          Мои бронирования
        </h1>
      </div>

      {bookings.length === 0 ? (
        <div className={styles.empty}>
          <Calendar size={64} />
          <h3>У вас пока нет бронирований</h3>
          <p>Забронируйте столик в ресторане Челентано</p>
          <Link href="/booking" className={styles.bookBtn}>
            Забронировать столик
          </Link>
        </div>
      ) : (
        <div className={styles.bookingsList}>
          {bookings.map(booking => {
            const status = statusConfig[booking.status];
            const bookingDate = new Date(booking.date);
            const isPast = bookingDate < new Date();
            
            return (
              <div key={booking.id} className={styles.bookingCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.tableInfo}>
                    <span className={styles.tableNumber}>Столик №{booking.table.number}</span>
                    <span className={styles.tableSeats}>{booking.table.seats} мест</span>
                  </div>
                  <span className={styles.status} style={{ background: `${status.color}20`, color: status.color }}>
                    {status.icon}
                    {status.label}
                  </span>
                </div>
                
                <div className={styles.cardBody}>
                  <div className={styles.detail}>
                    <Calendar size={16} />
                    <span>{bookingDate.toLocaleDateString('ru-RU')}</span>
                  </div>
                  <div className={styles.detail}>
                    <Clock size={16} />
                    <span>{booking.time}</span>
                  </div>
                  <div className={styles.detail}>
                    <Users size={16} />
                    <span>{booking.guests} {booking.guests === 1 ? 'гость' : booking.guests < 5 ? 'гостя' : 'гостей'}</span>
                  </div>
                  <div className={styles.detail}>
                    <Phone size={16} />
                    <span>{booking.customerPhone}</span>
                  </div>
                </div>
                
                {booking.comment && (
                  <div className={styles.comment}>
                    📝 {booking.comment}
                  </div>
                )}
                
                <div className={styles.cardFooter}>
                  <div className={styles.createdAt}>
                    Забронировано: {new Date(booking.createdAt).toLocaleDateString('ru-RU')}
                  </div>
                  {booking.status === 'PENDING' && !isPast && (
                    <button onClick={() => cancelBooking(booking.id)} className={styles.cancelBtn}>
                      Отменить
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}