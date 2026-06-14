'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import { 
  ArrowLeft, Crown, Shield, User, Calendar, Phone, Mail, 
  CheckCircle, Star, Award, Coffee, Pizza, Heart, 
  ShoppingBag, TrendingUp, MapPin, Clock, Users, Gift,
  Medal, Sparkles, Diamond, ThumbsUp, Smile, ChefHat,
  Zap, Trophy
} from 'lucide-react';
import { getLevelBySpent, LEVELS } from '@/lib/levels';
import styles from './page.module.scss';

interface PublicUser {
  id: string;
  email: string;
  phone: string;
  name: string | null;
  role: string;
  phoneVerified: boolean;
  createdAt: string;
  totalSpent: number;
  totalOrders: number;
  favoriteDish: string;
  averageCheck: number;
  lastOrderDate?: string;
  level?: string;
  nextLevelName?: string;
  levelProgress?: number;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [profileUser, setProfileUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLevel, setUserLevel] = useState<any>(null);
  const [nextLevel, setNextLevel] = useState<any>(null);
  const [levelProgress, setLevelProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const userId = params?.id as string;

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  useEffect(() => {
    if (profileUser) {
      // Анимация появления
      setTimeout(() => setIsVisible(true), 100);
      
      // Рассчитываем уровень
      const level = getLevelBySpent(profileUser.totalSpent, profileUser.totalOrders);
      setUserLevel(level);
      
      const nextLevelIndex = LEVELS.findIndex(l => l.id === level.id) + 1;
      if (nextLevelIndex < LEVELS.length) {
        setNextLevel(LEVELS[nextLevelIndex]);
        const progress = Math.min(100, Math.max(0, 
          ((profileUser.totalSpent - level.minSpent) / (LEVELS[nextLevelIndex].minSpent - level.minSpent)) * 100
        ));
        setLevelProgress(Math.round(progress));
      } else {
        setNextLevel(null);
        setLevelProgress(100);
      }
    }
  }, [profileUser]);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`/api/user/${userId}`);
      const data = await res.json();
      setProfileUser(data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleInfo = (role: string) => {
    const roles: Record<string, { label: string; icon: any; color: string; gradient: string; badge: string }> = {
      ADMIN: { 
        label: 'Администратор', 
        icon: <Crown size={18} />, 
        color: '#f44336',
        gradient: 'linear-gradient(135deg, #f44336, #e91e63)',
        badge: '👑 Владелец ресторана'
      },
      MANAGER: { 
        label: 'Менеджер', 
        icon: <Shield size={18} />, 
        color: '#ff9800',
        gradient: 'linear-gradient(135deg, #ff9800, #ffc107)',
        badge: '🛡️ Управляющий'
      },
      USER: { 
        label: 'Гурман', 
        icon: <ChefHat size={18} />, 
        color: '#2196f3',
        gradient: 'linear-gradient(135deg, #2196f3, #00bcd4)',
        badge: '🍽️ Любитель вкусной еды'
      }
    };
    return roles[role] || roles.USER;
  };

  const getLevelIcon = (iconName: string, size: number = 24) => {
    switch (iconName) {
      case '🌱': return <span style={{ fontSize: size }}>🌱</span>;
      case '🍜': return <span style={{ fontSize: size }}>🍜</span>;
      case '🔍': return <span style={{ fontSize: size }}>🔍</span>;
      case '🍷': return <span style={{ fontSize: size }}>🍷</span>;
      case '🎓': return <span style={{ fontSize: size }}>🎓</span>;
      case '👨‍🍳': return <span style={{ fontSize: size }}>👨‍🍳</span>;
      case '🏆': return <Trophy size={size} />;
      case '🌟': return <Star size={size} fill="currentColor" />;
      case '💎': return <Sparkles size={size} />;
      case '⭐': return <Star size={size} />;
      case '👑': return <Crown size={size} />;
      case '🏅': return <Medal size={size} />;
      default: return <Zap size={size} />;
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loaderWrapper}>
          <div className={styles.loader}></div>
          <p>Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className={styles.notFoundContainer}>
        <div className={styles.notFoundCard}>
          <User size={80} className={styles.notFoundIcon} />
          <h2>Пользователь не найден</h2>
          <p>Возможно, аккаунт был удалён или вы указали неверный ID</p>
          <Link href="/" className={styles.homeBtn}>
            <ArrowLeft size={18} />
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  const roleInfo = getRoleInfo(profileUser.role);
  const isOwnProfile = user?.id === profileUser.id;
  const memberSince = new Date(profileUser.createdAt);
  const monthsCount = Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24 * 30));

  return (
    <div className={styles.container}>
      {/* Фоновый эффект */}
      <div className={styles.bgEffects}>
        <div className={styles.bgBlur1}></div>
        <div className={styles.bgBlur2}></div>
        <div className={styles.bgBlur3}></div>
      </div>

      {/* Кнопка назад */}
      <div className={styles.backButton}>
        <Link href={isOwnProfile ? '/profile' : '/admin/users'} className={styles.backLink}>
          <ArrowLeft size={20} />
          {isOwnProfile ? 'В личный кабинет' : 'К списку пользователей'}
        </Link>
      </div>

      {/* Hero секция */}
      <div className={`${styles.heroSection} ${isVisible ? styles.visible : ''}`} style={{ background: roleInfo.gradient }}>
        <div className={styles.heroContent}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatarRing}>
              <div className={styles.avatar}>
                {profileUser.name ? profileUser.name[0].toUpperCase() : '?'}
              </div>
            </div>
            {profileUser.role === 'ADMIN' && (
              <div className={styles.crownIcon}>
                <Crown size={24} fill="#FFD700" stroke="#FFD700" />
              </div>
            )}
          </div>
          
          <h1 className={styles.userName}>
            {profileUser.name || profileUser.email.split('@')[0]}
          </h1>
          
          <div className={styles.userBadges}>
            <span className={styles.roleBadge}>
              {roleInfo.icon}
              {roleInfo.label}
            </span>
            {profileUser.phoneVerified && (
              <span className={styles.verifiedBadge}>
                <CheckCircle size={14} />
                Подтверждён
              </span>
            )}
            {monthsCount >= 6 && (
              <span className={styles.vipBadge}>
                <Diamond size={14} />
                VIP клиент
              </span>
            )}
          </div>
          
          <p className={styles.userQuote}>{roleInfo.badge}</p>
          
          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{profileUser.totalOrders}</div>
              <div className={styles.statLabel}>Заказов</div>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{profileUser.totalSpent.toLocaleString()} ₽</div>
              <div className={styles.statLabel}>Потрачено</div>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>
                {profileUser.averageCheck > 0 ? profileUser.averageCheck.toFixed(0) : '—'} ₽
              </div>
              <div className={styles.statLabel}>Средний чек</div>
            </div>
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className={`${styles.content} ${isVisible ? styles.visible : ''}`}>
        {/* Карточка уровня */}
        {userLevel && (
          <div className={styles.levelCard}>
            <div className={styles.levelHeader}>
              <div className={styles.levelIcon} style={{ color: userLevel.color }}>
                {getLevelIcon(userLevel.icon, 32)}
              </div>
              <div className={styles.levelInfo}>
                <div className={styles.levelName}>
                  <span style={{ color: userLevel.color }}>{userLevel.name}</span>
                  <span className={styles.levelTitle}>{userLevel.title}</span>
                </div>
                <div className={styles.levelProgressBar}>
                  <div className={styles.levelProgressFill} style={{ width: `${levelProgress}%`, background: userLevel.color }} />
                </div>
                {nextLevel && (
                  <div className={styles.levelNext}>
                    До уровня {nextLevel.name}: {levelProgress}%
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Информационная сетка */}
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <div className={styles.cardIcon} style={{ background: '#e3f2fd', color: '#2196f3' }}>
              <Mail size={24} />
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardLabel}>Email</span>
              <span className={styles.cardValue}>{profileUser.email}</span>
            </div>
          </div>
          
          <div className={styles.infoCard}>
            <div className={styles.cardIcon} style={{ background: '#e8f5e9', color: '#4caf50' }}>
              <Phone size={24} />
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardLabel}>Телефон</span>
              <span className={styles.cardValue}>{profileUser.phone}</span>
            </div>
          </div>
          
          <div className={styles.infoCard}>
            <div className={styles.cardIcon} style={{ background: '#fff3e0', color: '#ff9800' }}>
              <Calendar size={24} />
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardLabel}>С нами с</span>
              <span className={styles.cardValue}>
                {memberSince.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
          
          <div className={styles.infoCard}>
            <div className={styles.cardIcon} style={{ background: '#fce4ec', color: '#e91e63' }}>
              <Heart size={24} />
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardLabel}>Любимое блюдо</span>
              <span className={styles.cardValue}>{profileUser.favoriteDish || '—'}</span>
            </div>
          </div>
        </div>

        {/* Достижения - с анимацией при наведении */}
        <div className={styles.achievementsSection}>
          <h2 className={styles.sectionTitle}>
            <Sparkles size={20} />
            Достижения
          </h2>
          <div className={styles.achievementsGrid}>
            {profileUser.totalOrders >= 1 && (
              <div className={styles.achievementCard}>
                <div className={styles.achievementIcon}>🎉</div>
                <div className={styles.achievementName}>Первый заказ</div>
                <div className={styles.achievementDesc}>Совершил первый заказ</div>
              </div>
            )}
            {profileUser.totalOrders >= 5 && (
              <div className={styles.achievementCard}>
                <div className={styles.achievementIcon}>⭐</div>
                <div className={styles.achievementName}>Постоянный клиент</div>
                <div className={styles.achievementDesc}>5+ заказов</div>
              </div>
            )}
            {profileUser.totalOrders >= 10 && (
              <div className={styles.achievementCard}>
                <div className={styles.achievementIcon}>🏆</div>
                <div className={styles.achievementName}>VIP статус</div>
                <div className={styles.achievementDesc}>10+ заказов</div>
              </div>
            )}
            {profileUser.totalSpent >= 10000 && (
              <div className={styles.achievementCard}>
                <div className={styles.achievementIcon}>💰</div>
                <div className={styles.achievementName}>Тратящий</div>
                <div className={styles.achievementDesc}>Потрачено 10,000+ ₽</div>
              </div>
            )}
            {profileUser.phoneVerified && (
              <div className={styles.achievementCard}>
                <div className={styles.achievementIcon}>📱</div>
                <div className={styles.achievementName}>Верифицирован</div>
                <div className={styles.achievementDesc}>Телефон подтверждён</div>
              </div>
            )}
            {monthsCount >= 6 && (
              <div className={styles.achievementCard}>
                <div className={styles.achievementIcon}>💎</div>
                <div className={styles.achievementName}>Полгода с нами</div>
                <div className={styles.achievementDesc}>Лояльный клиент</div>
              </div>
            )}
          </div>
        </div>

        {/* Любимые категории */}
        <div className={styles.favoritesSection}>
          <h2 className={styles.sectionTitle}>
            <Heart size={20} />
            Предпочтения
          </h2>
          <div className={styles.favoritesGrid}>
            <div className={styles.favoriteCard}>
              <Pizza size={32} className={styles.favIcon} />
              <span>Пицца</span>
            </div>
            <div className={styles.favoriteCard}>
              <Coffee size={32} className={styles.favIcon} />
              <span>Кофе</span>
            </div>
            <div className={styles.favoriteCard}>
              <ChefHat size={32} className={styles.favIcon} />
              <span>Дагестанская кухня</span>
            </div>
          </div>
        </div>

        {/* Статистика заказов */}
        <div className={styles.statsSection}>
          <h2 className={styles.sectionTitle}>
            <TrendingUp size={20} />
            Статистика заказов
          </h2>
          <div className={styles.statsCards}>
            <div className={styles.statsCard}>
              <div className={styles.statsHeader}>
                <ShoppingBag size={20} />
                <span>Всего заказов</span>
              </div>
              <div className={styles.statsNumber}>{profileUser.totalOrders}</div>
            </div>
            <div className={styles.statsCard}>
              <div className={styles.statsHeader}>
                <TrendingUp size={20} />
                <span>Общая сумма</span>
              </div>
              <div className={styles.statsNumber}>{profileUser.totalSpent.toLocaleString()} ₽</div>
            </div>
            <div className={styles.statsCard}>
              <div className={styles.statsHeader}>
                <Award size={20} />
                <span>Средний чек</span>
              </div>
              <div className={styles.statsNumber}>
                {profileUser.averageCheck > 0 ? profileUser.averageCheck.toFixed(0) : '—'} ₽
              </div>
            </div>
          </div>
        </div>

        {/* Бонусная информация */}
        <div className={styles.bonusSection}>
          <div className={styles.bonusCard}>
            <Gift size={32} className={styles.bonusIcon} />
            <div className={styles.bonusContent}>
              <h3>Приветственный бонус!</h3>
              <p>Зарегистрируйтесь и получите скидку 10% на первый заказ</p>
            </div>
            {!isOwnProfile && (
              <Link href="/register" className={styles.bonusBtn}>
                Получить бонус
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}