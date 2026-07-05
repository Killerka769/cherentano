'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import styles from './LoadIndicator.module.scss';

interface LoadInterval {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  loadLevel: number;
  comment: string | null;
  isActive: boolean;
}

interface LoadIndicatorProps {
  date?: string;
  showTitle?: boolean;
  compact?: boolean;
}

export default function LoadIndicator({ date, showTitle = true, compact = false }: LoadIndicatorProps) {
  const [intervals, setIntervals] = useState<LoadInterval[]>([]);
  const [currentLoad, setCurrentLoad] = useState<LoadInterval | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchIntervals();
  }, [date]);

  useEffect(() => {
    if (intervals.length > 0) {
      updateCurrentLoad();
      const interval = setInterval(updateCurrentLoad, 60000);
      return () => clearInterval(interval);
    }
  }, [intervals]);

  const fetchIntervals = async () => {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/load-intervals?date=${targetDate}`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setIntervals(data.intervals || []);
    } catch (error) {
      console.error('Failed to fetch load intervals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCurrentLoad = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const current = intervals.find(i => 
      i.startTime <= timeStr && i.endTime >= timeStr
    );
    
    setCurrentLoad(current || null);
  };

  const getLoadLevelInfo = (level: number) => {
    if (level <= 2) {
      return { 
        label: 'Низкая загруженность', 
        color: '#4caf50', 
        icon: <CheckCircle size={16} />,
        description: 'Заказы будут готовы быстро' 
      };
    }
    if (level <= 5) {
      return { 
        label: 'Средняя загруженность', 
        color: '#ff9800', 
        icon: <Clock size={16} />,
        description: 'Время готовки до 30 минут' 
      };
    }
    if (level <= 8) {
      return { 
        label: 'Высокая загруженность', 
        color: '#f44336', 
        icon: <AlertCircle size={16} />,
        description: 'Время готовки 30-45 минут' 
      };
    }
    return { 
      label: 'Максимальная загруженность', 
      color: '#d32f2f', 
      icon: <AlertTriangle size={16} />,
      description: 'Время готовки 45-60 минут' 
    };
  };

  if (isLoading) {
    return <div className={styles.skeleton}>Загрузка...</div>;
  }

  // Если нет интервалов, показываем сообщение
  if (intervals.length === 0) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        {showTitle && <div className={styles.title}>⏱️ Загруженность кухни</div>}
        <div className={styles.noData}>
          <CheckCircle size={compact ? 16 : 20} color="#4caf50" />
          <span>Нет данных о загруженности</span>
        </div>
      </div>
    );
  }

  if (!currentLoad) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        {showTitle && <div className={styles.title}>⏱️ Загруженность кухни</div>}
        <div className={styles.noData}>
          <CheckCircle size={compact ? 16 : 20} color="#4caf50" />
          <span>Сейчас заказов мало, ожидание минимальное</span>
        </div>
      </div>
    );
  }

  const info = getLoadLevelInfo(currentLoad.loadLevel);

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      {showTitle && <div className={styles.title}>⏱️ Загруженность кухни</div>}
      
      <div className={styles.loadCard} style={{ borderLeftColor: info.color }}>
        <div className={styles.loadHeader}>
          <div className={styles.loadIcon} style={{ color: info.color }}>
            {info.icon}
          </div>
          <div className={styles.loadInfo}>
            <div className={styles.loadLabel} style={{ color: info.color }}>
              {info.label}
            </div>
            <div className={styles.loadTime}>
              {currentLoad.startTime} — {currentLoad.endTime}
            </div>
          </div>
          <div className={styles.loadLevel}>
            <span className={styles.levelNumber}>{currentLoad.loadLevel}</span>
            <span className={styles.levelMax}>/10</span>
          </div>
        </div>
        
        {/* ШКАЛА ЗАГРУЖЕННОСТИ */}
        <div className={styles.loadBar}>
          <div 
            className={styles.loadBarFill} 
            style={{ 
              width: `${(currentLoad.loadLevel / 10) * 100}%`,
              background: info.color
            }}
          />
        </div>
        
        <div className={styles.loadDescription}>
          <span>{info.description}</span>
          {currentLoad.comment && (
            <span className={styles.comment}>📌 {currentLoad.comment}</span>
          )}
        </div>
      </div>
    </div>
  );
}