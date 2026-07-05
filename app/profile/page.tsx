'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  User, Package, LogOut, Phone, Mail, CheckCircle, Clock, 
  Calendar, Star, Award, Coffee, Pizza, Crown, Shield,
  Settings, Heart, ShoppingBag, TrendingUp, Lock, ArrowLeft,
  Users, Share2, Percent, Gift, Sparkles, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import LevelProgress from '../components/ui/LevelProgress/LevelProgress';
import styles from './page.module.scss';
import UserDiscounts from '../components/profile/UserDiscounts/UserDiscounts';
import UserHelpRequests from '../components/profile/UserHelpRequests/UserHelpRequests';

interface StatusLog {
  status: string;
  comment: string | null;
  createdAt: string;
  changedBy: string | null;
  user?: {
    id: string;
    name: string;
    role: string;
  };
}

interface Order {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  orderType: string;
  isCharity?: boolean
  items: OrderItem[];
  statusLogs?: StatusLog[];
}

interface OrderItem {
  dishName: string;
  quantity: number;
  price: number;
}

interface Booking {
  id: string;
  tableId: number;
  table: { number: number; seats: number };
  date: string;
  time: string;
  guests: number;
  status: string;
}

interface PublicUser {
  id: string;
  email: string;
  phone: string;
  name: string | null;
  role: string;
  phoneVerified: boolean;
  createdAt: string;
  _count?: { orders: number };
  totalSpent?: number;
  favoriteDish?: string;
  level?: string;
  levelProgress?: number;
  birthDate?: string | null;
}

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [publicUser, setPublicUser] = useState<PublicUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'bookings' | 'stats' | 'discounts' | 'charity'>('profile');
  const [isViewingOther, setIsViewingOther] = useState(false);
  const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0, favoriteDish: '', averageCheck: 0 });
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [birthdayInfo, setBirthdayInfo] = useState<any>(null);
  const [isBirthdayLoading, setIsBirthdayLoading] = useState(true);
  const [birthdayChecked, setBirthdayChecked] = useState(false);
  const [userBirthDate, setUserBirthDate] = useState<string | null>(null);

  const userId = params?.id as string;
  const isOwnProfile = !userId || userId === user?.id;

  useEffect(() => {
    if (!loading && !user && !isOwnProfile) {
      router.push('/login');
    }
  }, [user, loading, router, isOwnProfile]);

  useEffect(() => {
    if (userId && userId !== user?.id) {
      fetchPublicUser();
      setIsViewingOther(true);
    } else if (user) {
      fetchOrders();
      fetchBookings();
      setIsViewingOther(false);
      if (!birthdayChecked) {
        checkBirthday();
        setBirthdayChecked(true);
      }
      fetchUserBirthDate();
    }
  }, [user, userId]);

  useEffect(() => {
    if (orders.length > 0 || !isViewingOther) {
      calculateStats();
    }
  }, [orders]);

  const fetchPublicUser = async () => {
    try {
      const res = await fetch(`/api/user/${userId}`);
      const data = await res.json();
      setPublicUser(data.user);
      if (data.user?.birthDate) {
        setUserBirthDate(data.user.birthDate);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const fetchUserBirthDate = async () => {
    try {
      const res = await fetch('/api/user/birthdate');
      const data = await res.json();
      if (data.birthDate) {
        setUserBirthDate(data.birthDate);
      }
    } catch (error) {
      console.error('Failed to fetch birth date:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  };

  const checkBirthday = async () => {
    setIsBirthdayLoading(true);
    try {
      const res = await fetch('/api/user/birthday-discount');
      const data = await res.json();
      setBirthdayInfo(data);
      if (data.hasBirthday && data.discountGiven && !data.alreadyUsed) {
        toast.success('🎉 С днём рождения! Скидка 15% активирована!', {
          duration: 5000,
          icon: '🎂',
        });
      }
    } catch (error) {
      console.error('Failed to check birthday:', error);
    } finally {
      setIsBirthdayLoading(false);
    }
  };

  const calculateStats = () => {
    setIsStatsLoading(true);
    
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
    const averageCheck = totalOrders > 0 ? totalSpent / totalOrders : 0;
    
    const dishCount: Record<string, number> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        dishCount[item.dishName] = (dishCount[item.dishName] || 0) + item.quantity;
      });
    });
    const favoriteDish = Object.entries(dishCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    
    setStats({ totalOrders, totalSpent, favoriteDish, averageCheck });
    setIsStatsLoading(false);
  };

  const getRoleInfo = (role: string) => {
    const roles: Record<string, { label: string; icon: any; color: string; bg: string }> = {
      ADMIN: { 
        label: 'Администратор', 
        icon: <Crown size={16} />, 
        color: '#f44336',
        bg: '#ffebee'
      },
      MANAGER: { 
        label: 'Менеджер', 
        icon: <Shield size={16} />, 
        color: '#ff9800',
        bg: '#fff3e0'
      },
      USER: { 
        label: 'Пользователь', 
        icon: <User size={16} />, 
        color: '#2196f3',
        bg: '#e3f2fd'
      }
    };
    return roles[role] || roles.USER;
  };

  const getStatusText = (status: string, order?: Order) => {
    const statusMap: Record<string, string> = {
      NEW: '🆕 Новый',
      CALLED: '📞 Позвонили',
      CONFIRMED: '✅ Подтвержден',
      PREPARING: '🍳 Готовится',
      READY: '📦 Готов',
      DELIVERING: '🚚 В пути',
      COMPLETED: '✅ Выполнен',
      CANCELLED: '❌ Отменен'
    };
    
    // Если это благотворительный заказ, меняем отображение
    if (order?.isCharity) {
      if (status === 'CONFIRMED') return '❤️ Одобрено';
      if (status === 'COMPLETED') return '🎉 Доставлено нуждающемуся';
    }
    
    return statusMap[status] || status;
  };

  const getBookingStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: '⏳ Ожидает подтверждения',
      CONFIRMED: '✅ Подтверждено',
      CANCELLED: '❌ Отменено',
      COMPLETED: '🎉 Посещено',
      NO_SHOW: '⚠️ Не пришли'
    };
    return statusMap[status] || status;
  };

  const getBookingStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#ff9800',
      CONFIRMED: '#4caf50',
      CANCELLED: '#f44336',
      COMPLETED: '#2196f3',
      NO_SHOW: '#9e9e9e'
    };
    return colors[status] || '#9e9e9e';
  };

  const displayUser = isViewingOther ? publicUser : user;
  const roleInfo = displayUser ? getRoleInfo(displayUser.role) : null;
  const displayBirthDate = isViewingOther ? userBirthDate : user?.birthDate;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>
          <div className={styles.spinner}></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (isViewingOther && !publicUser) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <User size={64} />
          <h2>Пользователь не найден</h2>
          <Link href="/" className={styles.backBtn}>Вернуться на главную</Link>
        </div>
      </div>
    );
  }

  if (!displayUser) return null;

  const displayOrders = isViewingOther ? [] : orders;
  const displayBookings = isViewingOther ? [] : bookings;
  const createdAt = displayUser.createdAt ? new Date(displayUser.createdAt) : new Date();
  const memberSince = !isNaN(createdAt.getTime()) ? createdAt : new Date();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {isViewingOther ? 'Профиль пользователя' : 'Личный кабинет'}
          </h1>
          {isViewingOther && publicUser && (
            <p className={styles.subtitle}>Просмотр профиля {publicUser.name || publicUser.email}</p>
          )}
        </div>
        {!isViewingOther && (
          <button onClick={logout} className={styles.logoutBtn}>
            <LogOut size={18} />
            Выйти
          </button>
        )}
        {isViewingOther && (
          <Link href="/admin/users" className={styles.backBtn}>
            <ArrowLeft size={18} />
            Назад к пользователям
          </Link>
        )}
      </div>

      {/* Hero секция профиля */}
      <div className={styles.heroSection}>
        <div className={styles.heroBg}></div>
        <div className={styles.avatarLarge}>
          {displayUser.name ? displayUser.name[0].toUpperCase() : '?'}
        </div>
        <h2 className={styles.userNameLarge}>{displayUser.name || 'Без имени'}</h2>
        <div className={styles.userRole} style={{ background: roleInfo?.bg, color: roleInfo?.color }}>
          {roleInfo?.icon}
          {roleInfo?.label}
        </div>
        <div className={styles.userMeta}>
          <span className={styles.userSince}>
            <Calendar size={14} />
            с {memberSince.toLocaleDateString('ru-RU')}
          </span>
          {displayUser.phoneVerified && (
            <span className={styles.verifiedBadge}>
              <CheckCircle size={14} /> Телефон подтвержден
            </span>
          )}
          {displayBirthDate && (
            <span className={styles.birthDateBadge}>
              <Gift size={14} />
              ДР: {new Date(displayBirthDate).toLocaleDateString('ru-RU')}
            </span>
          )}
        </div>
        
        <button onClick={() => {
          const url = `${window.location.origin}/profile/${displayUser.id}`;
          if (navigator.share) {
            navigator.share({
              title: `${displayUser.name || 'Пользователь'} - Челентано`,
              text: `Посмотрите профиль ${displayUser.name || 'пользователя'} в ресторане Челентано!`,
              url: url,
            });
          } else {
            navigator.clipboard.writeText(url);
            toast.success('Ссылка на профиль скопирована!');
          }
        }} className={styles.shareBtn}>
          <Share2 size={18} />
          Поделиться профилем
        </button>
      </div>

      {/* Блок дня рождения */}
      {!isViewingOther && !isBirthdayLoading && birthdayInfo && (
        <div className={styles.birthdaySection}>
          {birthdayInfo.hasBirthday ? (
            <div className={styles.birthdayBanner}>
              <div className={styles.birthdayIcon}>
                <Gift size={24} />
                <Sparkles size={16} className={styles.birthdaySparkle} />
              </div>
              <div className={styles.birthdayContent}>
                <h3>🎉 С днём рождения!</h3>
                <p>
                  {birthdayInfo.discountGiven && !birthdayInfo.alreadyUsed
                    ? 'Скидка 15% активирована! Действует 7 дней.'
                    : 'Скидка на день рождения уже была активирована.'}
                </p>
              </div>
              <span className={styles.birthdayBadge}>-15%</span>
            </div>
          ) : birthdayInfo.daysUntil !== undefined && (
            <div className={styles.birthdayReminder}>
              <Calendar size={18} />
              <span>
                {birthdayInfo.daysUntil === 0 
                  ? '🎂 Сегодня день рождения! Зайдите в профиль для активации скидки!'
                  : `До дня рождения осталось ${birthdayInfo.daysUntil} ${getDaysWord(birthdayInfo.daysUntil)}`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Уровень пользователя */}
      {!isViewingOther && (
        <LevelProgress 
          totalSpent={stats.totalSpent} 
          totalOrders={stats.totalOrders}
          isLoading={isStatsLoading}
          onLevelUp={() => {
            fetchOrders();
          }}
        />
      )}

      {/* Статистика для своего профиля */}
      {!isViewingOther && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#e3f2fd', color: '#2196f3' }}>
              <ShoppingBag size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{isStatsLoading ? '...' : stats.totalOrders}</span>
              <span className={styles.statLabel}>Всего заказов</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#e8f5e9', color: '#4caf50' }}>
              <TrendingUp size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{isStatsLoading ? '...' : `${stats.totalSpent.toLocaleString()} ₽`}</span>
              <span className={styles.statLabel}>Потрачено всего</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#fff3e0', color: '#ff9800' }}>
              <Award size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{isStatsLoading ? '...' : `${stats.averageCheck.toFixed(0)} ₽`}</span>
              <span className={styles.statLabel}>Средний чек</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#fce4ec', color: '#e91e63' }}>
              <Heart size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{isStatsLoading ? '...' : stats.favoriteDish}</span>
              <span className={styles.statLabel}>Любимое блюдо</span>
            </div>
          </div>
        </div>
      )}

      {/* Табы */}
      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab('profile')}
          className={`${styles.tab} ${activeTab === 'profile' ? styles.active : ''}`}
        >
          <User size={18} />
          Профиль
        </button>
        {!isViewingOther && (
          <>
            <button
              onClick={() => setActiveTab('orders')}
              className={`${styles.tab} ${activeTab === 'orders' ? styles.active : ''}`}
            >
              <Package size={18} />
              Заказы ({displayOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`${styles.tab} ${activeTab === 'bookings' ? styles.active : ''}`}
            >
              <Calendar size={18} />
              Бронирования ({displayBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`${styles.tab} ${activeTab === 'stats' ? styles.active : ''}`}
            >
              <TrendingUp size={18} />
              Статистика
            </button>
            <button
              onClick={() => setActiveTab('discounts')}
              className={`${styles.tab} ${activeTab === 'discounts' ? styles.active : ''}`}
            >
              <Percent size={18} />
              Скидки
            </button>
            <button
              onClick={() => setActiveTab('charity')}
              className={`${styles.tab} ${activeTab === 'charity' ? styles.active : ''}`}
            >
              <Heart size={18} />
              Моя помощь
            </button>
          </>
        )}
      </div>

      {/* Контент - Профиль */}
      {activeTab === 'profile' && (
        <div className={styles.profileCard}>
          <div className={styles.profileSection}>
            <h3>Контактная информация</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <Mail size={18} />
                <div>
                  <label>Email</label>
                  <span>{displayUser.email}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Phone size={18} />
                <div>
                  <label>Телефон</label>
                  <span>{displayUser.phone}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.profileSection}>
            <h3>Информация об аккаунте</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <Calendar size={18} />
                <div>
                  <label>Дата регистрации</label>
                  <span>{memberSince.toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                {displayUser.phoneVerified ? <CheckCircle size={18} /> : <Clock size={18} />}
                <div>
                  <label>Статус верификации</label>
                  <span className={displayUser.phoneVerified ? styles.verified : styles.unverified}>
                    {displayUser.phoneVerified ? 'Телефон подтвержден' : 'Ожидает подтверждения'}
                  </span>
                </div>
              </div>
              {displayBirthDate && (
                <div className={styles.infoItem}>
                  <Gift size={18} />
                  <div>
                    <label>Дата рождения</label>
                    <span>{new Date(displayBirthDate).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isViewingOther && (
            <div className={styles.profileSection}>
              <h3>Настройки</h3>
              <div className={styles.settingsLinks}>
                <Link href="/profile/edit" className={styles.settingsLink}>
                  <Settings size={18} />
                  Редактировать профиль
                </Link>
                <Link href="/profile/change-password" className={styles.settingsLink}>
                  <span className={styles.lockIcon}>🔒</span>
                  Сменить пароль
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Контент - Заказы с причиной отмены */}
      {activeTab === 'orders' && !isViewingOther && (
        <div className={styles.ordersList}>
          {displayOrders.length === 0 ? (
            <div className={styles.emptyOrders}>
              <Package size={64} />
              <h3>У вас пока нет заказов</h3>
              <p>Сделайте первый заказ и получите приятные бонусы!</p>
              <Link href="/menu" className={styles.orderBtn}>
                Перейти в меню
              </Link>
            </div>
          ) : (
            displayOrders.map(order => {
              // Находим лог с комментарием для отмены
              const cancelLog = order.statusLogs?.find(log => 
                (log.status === 'CANCELLED' || log.status === 'REJECTED') && log.comment
              );
              
              return (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div>
                      <span className={styles.orderId}>Заказ #{order.id}</span>
                      <span className={styles.orderDate}>
                        <Clock size={14} />
                        {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <span className={`${styles.orderStatus} ${styles[order.status.toLowerCase()]}`}>
                      {getStatusText(order.status, order)}
                    </span>
                  </div>
                  
                  <div className={styles.orderItems}>
                    {order.items.map((item, idx) => (
                      <div key={idx} className={styles.orderItem}>
                        <span>{item.dishName} x{item.quantity}</span>
                        <span>{item.price * item.quantity} ₽</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className={styles.orderFooter}>
                    <div className={styles.orderType}>
                      {order.orderType === 'PICKUP' ? '🏠 Самовывоз' : '🚚 Доставка'}
                    </div>
                    <div className={styles.orderTotal}>
                      Итого: <strong>{order.total} ₽</strong>
                    </div>
                  </div>

                  {/* Блок с причиной отмены */}
                  {cancelLog && (
                    <div className={styles.cancelBlock}>
                      <div className={styles.cancelHeader}>
                        <AlertCircle size={16} className={styles.cancelIcon} />
                        <strong>Причина отмены</strong>
                      </div>
                      <p className={styles.cancelReason}>{cancelLog.comment}</p>
                      {cancelLog.user && cancelLog.user.id && (
                        <div className={styles.cancelBy}>
                          Отменил: 
                          <Link href={`/profile/${cancelLog.user.id}`} className={styles.cancelByLink}>
                            {cancelLog.user.name || 'Менеджер'}
                          </Link>
                        </div>
                      )}
                      {cancelLog.user && !cancelLog.user.id && (
                        <div className={styles.cancelBy}>
                          Отменил: {cancelLog.user.name || 'Менеджер'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Контент - Бронирования */}
      {activeTab === 'bookings' && !isViewingOther && (
        <div className={styles.bookingsList}>
          {displayBookings.length === 0 ? (
            <div className={styles.emptyOrders}>
              <Calendar size={64} />
              <h3>У вас пока нет бронирований</h3>
              <p>Забронируйте столик в ресторане Челентано</p>
              <Link href="/booking" className={styles.orderBtn}>
                Забронировать столик
              </Link>
            </div>
          ) : (
            displayBookings.map(booking => (
              <div key={booking.id} className={styles.bookingCard}>
                <div className={styles.bookingHeader}>
                  <div>
                    <span className={styles.bookingTable}>Столик №{booking.table.number}</span>
                    <span className={styles.bookingSeats}>{booking.table.seats} мест</span>
                  </div>
                  <span 
                    className={styles.bookingStatus}
                    style={{ background: `${getBookingStatusColor(booking.status)}20`, color: getBookingStatusColor(booking.status) }}
                  >
                    {getBookingStatusText(booking.status)}
                  </span>
                </div>
                
                <div className={styles.bookingDetails}>
                  <div className={styles.bookingDetail}>
                    <Calendar size={16} />
                    <span>{new Date(booking.date).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <div className={styles.bookingDetail}>
                    <Clock size={16} />
                    <span>{booking.time}</span>
                  </div>
                  <div className={styles.bookingDetail}>
                    <Users size={16} />
                    <span>{booking.guests} {booking.guests === 1 ? 'гость' : booking.guests < 5 ? 'гостя' : 'гостей'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Контент - Статистика */}
      {activeTab === 'stats' && !isViewingOther && (
        <div className={styles.statsDetails}>
          <div className={styles.statsCardLarge}>
            <h3>📊 Детальная статистика</h3>
            <div className={styles.statsList}>
              <div className={styles.statsRow}>
                <span>Общее количество заказов:</span>
                <strong>{stats.totalOrders}</strong>
              </div>
              <div className={styles.statsRow}>
                <span>Общая сумма заказов:</span>
                <strong>{stats.totalSpent.toLocaleString()} ₽</strong>
              </div>
              <div className={styles.statsRow}>
                <span>Средний чек:</span>
                <strong>{stats.averageCheck.toFixed(0)} ₽</strong>
              </div>
              <div className={styles.statsRow}>
                <span>Любимое блюдо:</span>
                <strong>{stats.favoriteDish}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Контент - Скидки */}
      {activeTab === 'discounts' && (
        <div className={styles.discountsSection}>
          <UserDiscounts />
        </div>
      )}

      {activeTab === 'charity' && (
        <div className={styles.charitySection}>
          <UserHelpRequests />
        </div>
      )}
    </div>
  );
}

function getDaysWord(days: number): string {
  if (days === 1) return 'день';
  if (days >= 2 && days <= 4) return 'дня';
  return 'дней';
}