'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Trophy, Star, Zap, Award, Sparkles, TrendingUp, ChevronRight } from 'lucide-react';
import { getLevelBySpent, getNextLevel, getProgressToNextLevel, LEVELS } from '@/lib/levels';
import confetti from 'canvas-confetti';
import styles from './LevelProgress.module.scss';

interface LevelProgressProps {
  totalSpent: number;
  totalOrders: number;
  onLevelUp?: () => void;
  isLoading?: boolean;
}

export default function LevelProgress({ totalSpent, totalOrders, onLevelUp, isLoading = false }: LevelProgressProps) {
  const [currentLevel, setCurrentLevel] = useState(getLevelBySpent(0, 0));
  const [nextLevel, setNextLevel] = useState(getNextLevel(currentLevel));
  const [progress, setProgress] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showPerks, setShowPerks] = useState(false);
  const [prevLevel, setPrevLevel] = useState(currentLevel);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasData, setHasData] = useState(false);
  const prevSpentRef = useRef(0);
  const prevOrdersRef = useRef(0);
  const hasLevelUpRef = useRef(false);

  // Ждем реальных данных (не нулей при загрузке)
  useEffect(() => {
    // Игнорируем нулевые данные при загрузке
    if (isLoading) return;
    
    // Если данные еще не загружены или это нулевые значения, ждем
    if (totalSpent === 0 && totalOrders === 0 && !hasData) return;
    
    // Отмечаем, что данные получены
    if (!hasData && (totalSpent > 0 || totalOrders > 0)) {
      setHasData(true);
    }
    
    // При первой инициализации с реальными данными
    if (!isInitialized && hasData) {
      const initialLevel = getLevelBySpent(totalSpent, totalOrders);
      const initialProgress = getProgressToNextLevel(totalSpent, totalOrders, initialLevel);
      
      setCurrentLevel(initialLevel);
      setNextLevel(getNextLevel(initialLevel));
      setProgress(initialProgress);
      setPrevLevel(initialLevel);
      setIsInitialized(true);
      prevSpentRef.current = totalSpent;
      prevOrdersRef.current = totalOrders;
      return;
    }
    
    // Если еще не инициализированы, выходим
    if (!isInitialized) return;
    
    // Проверяем, изменились ли данные
    const spentChanged = totalSpent !== prevSpentRef.current;
    const ordersChanged = totalOrders !== prevOrdersRef.current;
    
    if (!spentChanged && !ordersChanged) return;
    
    const newLevel = getLevelBySpent(totalSpent, totalOrders);
    const newProgress = getProgressToNextLevel(totalSpent, totalOrders, newLevel);
    
    setProgress(newProgress);
    
    // Проверяем, повысился ли уровень (и не было уже анимации)
    const isLevelUp = newLevel.id !== prevLevel.id && !hasLevelUpRef.current;
    
    if (isLevelUp) {
      hasLevelUpRef.current = true;
      
      setCurrentLevel(newLevel);
      setNextLevel(getNextLevel(newLevel));
      setShowCelebration(true);
      setShowPerks(true);
      
      // Конфетти
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: [newLevel.color, '#ffd700', '#c4492c'],
        startVelocity: 20,
      });
      
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.5, x: 0.3 },
          startVelocity: 15,
        });
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.5, x: 0.7 },
          startVelocity: 15,
        });
      }, 200);
      
      setTimeout(() => {
        setShowCelebration(false);
      }, 4000);
      
      setTimeout(() => {
        setShowPerks(false);
      }, 8000);
      
      if (onLevelUp) onLevelUp();
      
      setPrevLevel(newLevel);
    } else {
      setCurrentLevel(newLevel);
      setNextLevel(getNextLevel(newLevel));
      setPrevLevel(newLevel);
    }
    
    prevSpentRef.current = totalSpent;
    prevOrdersRef.current = totalOrders;
  }, [totalSpent, totalOrders, isLoading, isInitialized, hasData]);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case '🌱': return <span className={styles.iconEmoji}>🌱</span>;
      case '🍜': return <span className={styles.iconEmoji}>🍜</span>;
      case '🔍': return <span className={styles.iconEmoji}>🔍</span>;
      case '🍷': return <span className={styles.iconEmoji}>🍷</span>;
      case '🎓': return <span className={styles.iconEmoji}>🎓</span>;
      case '👨‍🍳': return <span className={styles.iconEmoji}>👨‍🍳</span>;
      case '🏆': return <Trophy size={24} />;
      case '🌟': return <Star size={24} fill="currentColor" />;
      case '💎': return <Sparkles size={24} />;
      case '⭐': return <Star size={24} />;
      case '👑': return <Award size={24} />;
      case '🏅': return <TrendingUp size={24} />;
      default: return <Zap size={24} />;
    }
  };

  // Скелетон во время загрузки
  if (isLoading || (!hasData && totalSpent === 0 && totalOrders === 0)) {
    return (
      <div className={styles.skeleton}>
        <div className={styles.skeletonCard}></div>
        <div className={styles.skeletonProgress}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Анимация повышения уровня */}
      {showCelebration && (
        <div className={styles.celebrationOverlay}>
          <div className={styles.celebrationCard}>
            <div className={styles.celebrationIcon}>🎉</div>
            <h2>Уровень повышен!</h2>
            <div className={styles.levelUpBadge}>
              <span className={styles.oldLevel}>{prevLevel.name}</span>
              <span className={styles.arrow}>→</span>
              <span className={styles.newLevel} style={{ color: currentLevel.color }}>{currentLevel.name}</span>
            </div>
            <p className={styles.celebrationTitle}>{currentLevel.title}</p>
            <div className={styles.celebrationPerks}>
              <p>✨ Новые возможности:</p>
              <ul>
                {currentLevel.perks.map((perk, idx) => (
                  <li key={idx}>{perk}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Панель с перками при клике */}
      {showPerks && (
        <div className={styles.perksPanel}>
          <div className={styles.perksHeader}>
            <span>🎁 Доступные привилегии</span>
            <button onClick={() => setShowPerks(false)}>✕</button>
          </div>
          <div className={styles.perksList}>
            {currentLevel.perks.map((perk, idx) => (
              <div key={idx} className={styles.perk}>
                <span>✓</span>
                {perk}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Основная карточка уровня */}
      <div className={styles.levelCard} style={{ background: currentLevel.bgColor }}>
        <div className={styles.levelIcon} style={{ color: currentLevel.color }}>
          {getIcon(currentLevel.icon)}
        </div>
        <div className={styles.levelInfo}>
          <div className={styles.levelName}>
            <span style={{ color: currentLevel.color }}>{currentLevel.name}</span>
            <span className={styles.levelTitle}>{currentLevel.title}</span>
          </div>
          <div className={styles.levelStats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>💰 Потрачено</span>
              <span className={styles.statValue}>{totalSpent.toLocaleString()} ₽</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>📦 Заказов</span>
              <span className={styles.statValue}>{totalOrders}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Прогресс до следующего уровня */}
      {nextLevel && (
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span>До уровня <strong style={{ color: nextLevel.color }}>{nextLevel.name}</strong></span>
            <span className={styles.progressPercent}>{progress}%</span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel.color})` }}
            />
          </div>
          <div className={styles.nextRewards}>
            <span className={styles.rewardLabel}>🎁 Откроется:</span>
            <div className={styles.rewardList}>
              {nextLevel.perks.slice(0, 2).map((perk, idx) => (
                <span key={idx} className={styles.rewardItem}>{perk}</span>
              ))}
              {nextLevel.perks.length > 2 && (
                <span className={styles.rewardMore}>+{nextLevel.perks.length - 2}</span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Кнопка "Все уровни" */}
      <Link href="/profile/levels" className={styles.historyBtn}>
        <span>🏆 Все уровни</span>
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}