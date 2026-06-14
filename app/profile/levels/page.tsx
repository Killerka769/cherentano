'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Crown, Star, Zap, Award, Sparkles, TrendingUp, ChevronRight, Gift, Trophy, Check } from 'lucide-react';
import { LEVELS, getLevelBySpent, getProgressToNextLevel } from '@/lib/levels';
import styles from './page.module.scss';

export default function LevelsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userLevel, setUserLevel] = useState<string>('NOVICE');
  const [userSpent, setUserSpent] = useState(0);
  const [userOrders, setUserOrders] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      const orders = data.orders || [];
      const totalSpent = orders.reduce((sum: number, o: any) => sum + o.total, 0);
      const totalOrders = orders.length;
      const level = getLevelBySpent(totalSpent, totalOrders);
      
      setUserSpent(totalSpent);
      setUserOrders(totalOrders);
      setUserLevel(level.id);
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const getIcon = (iconName: string, size: number = 48) => {
    switch (iconName) {
      case '🌱': return <span className={styles.iconEmoji} style={{ fontSize: size }}>🌱</span>;
      case '🍜': return <span className={styles.iconEmoji} style={{ fontSize: size }}>🍜</span>;
      case '🔍': return <span className={styles.iconEmoji} style={{ fontSize: size }}>🔍</span>;
      case '🍷': return <span className={styles.iconEmoji} style={{ fontSize: size }}>🍷</span>;
      case '🎓': return <span className={styles.iconEmoji} style={{ fontSize: size }}>🎓</span>;
      case '👨‍🍳': return <span className={styles.iconEmoji} style={{ fontSize: size }}>👨‍🍳</span>;
      case '🏆': return <Trophy size={size} />;
      case '🌟': return <Star size={size} fill="currentColor" />;
      case '💎': return <Sparkles size={size} />;
      case '⭐': return <Star size={size} />;
      case '👑': return <Crown size={size} />;
      case '🏅': return <Award size={size} />;
      default: return <Zap size={size} />;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/profile" className={styles.backLink}>
          <ArrowLeft size={20} />
          Назад в профиль
        </Link>
        <h1 className={styles.title}>
          <Crown size={28} />
          Все уровни программы лояльности
        </h1>
        <p className={styles.subtitle}>
          Чем больше заказов — тем выше ваш статус и больше привилегий
        </p>
      </div>

      {/* Текущий прогресс */}
      <div className={styles.currentProgress}>
        <div className={styles.progressCard}>
          <div className={styles.progressHeader}>
            <span>Ваш текущий прогресс</span>
            <span className={styles.progressValue}>
              {userSpent.toLocaleString()} ₽ / {LEVELS[LEVELS.length - 1].minSpent.toLocaleString()} ₽
            </span>
          </div>
          <div className={styles.globalProgressBar}>
            <div 
              className={styles.globalProgressFill}
              style={{ width: `${Math.min(100, (userSpent / LEVELS[LEVELS.length - 1].minSpent) * 100)}%` }}
            />
          </div>
          <div className={styles.progressStats}>
            <span>📦 {userOrders} заказов</span>
            <span>💰 {userSpent.toLocaleString()} ₽ потрачено</span>
          </div>
        </div>
      </div>

      {/* Список уровней */}
      <div className={styles.levelsList}>
        {LEVELS.map((level, index) => {
          const isUnlocked = userSpent >= level.minSpent && userOrders >= level.minOrders;
          const isCurrent = userLevel === level.id;
          const nextLevel = LEVELS[index + 1];
          const progressToNext = nextLevel ? getProgressToNextLevel(userSpent, userOrders, level) : 100;
          
          return (
            <div 
              key={level.id} 
              className={`${styles.levelCard} ${isUnlocked ? styles.unlocked : ''} ${isCurrent ? styles.current : ''}`}
            >
              <div className={styles.levelBadge}>
                <div className={styles.levelNumber}>{index + 1}</div>
                <div className={styles.levelIcon} style={{ color: level.color }}>
                  {getIcon(level.icon, 48)}
                </div>
              </div>
              
              <div className={styles.levelContent}>
                <div className={styles.levelHeader}>
                  <div>
                    <h2 className={styles.levelName} style={{ color: level.color }}>
                      {level.name}
                    </h2>
                    <p className={styles.levelTitle}>{level.title}</p>
                  </div>
                  {isCurrent && (
                    <span className={styles.currentBadge}>
                      <Crown size={14} />
                      Текущий уровень
                    </span>
                  )}
                  {isUnlocked && !isCurrent && (
                    <span className={styles.unlockedBadge}>
                      <Check size={14} />
                      Достигнут
                    </span>
                  )}
                </div>
                
                <div className={styles.levelRequirements}>
                  <div className={styles.requirement}>
                    <span>💰 Накопить</span>
                    <strong>{level.minSpent.toLocaleString()} ₽</strong>
                  </div>
                  <div className={styles.requirement}>
                    <span>📦 Сделать заказов</span>
                    <strong>{level.minOrders}</strong>
                  </div>
                </div>
                
                {!isUnlocked && nextLevel && (
                  <div className={styles.progressSection}>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill}
                        style={{ width: `${progressToNext}%`, background: level.color }}
                      />
                    </div>
                    <div className={styles.progressText}>
                      {progressToNext}% до следующего уровня
                    </div>
                  </div>
                )}
                
                <div className={styles.perksSection}>
                  <div className={styles.perksHeader}>
                    <Gift size={16} />
                    <span>Привилегии уровня</span>
                  </div>
                  <div className={styles.perksList}>
                    {level.perks.map((perk, idx) => (
                      <div key={idx} className={styles.perk}>
                        <ChevronRight size={14} />
                        {perk}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Бонусная информация */}
      <div className={styles.infoBox}>
        <div className={styles.infoIcon}>🎁</div>
        <div className={styles.infoContent}>
          <h3>Как повысить уровень?</h3>
          <p>
            • Делайте заказы в ресторане или с доставкой<br />
            • Каждый потраченный рубль приближает вас к новому статусу<br />
            • Привилегии действуют сразу после достижения уровня<br />
            • Статус сохраняется навсегда
          </p>
        </div>
      </div>
    </div>
  );
}