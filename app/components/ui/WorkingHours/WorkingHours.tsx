'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import styles from './WorkingHours.module.scss';

export default function WorkingHours() {
  const [info, setInfo] = useState({
    isOpen: true,
    hours: '11:00 - 23:00',
    isSpecialDay: false,
    specialMessage: '',
    isWeekend: false
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWorkingHours();
  }, []);

  const fetchWorkingHours = async () => {
    try {
      const res = await fetch('/api/settings/hours');
      const data = await res.json();
      setInfo(data);
    } catch (error) {
      console.error('Failed to fetch working hours:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return null;

  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long' });

  return (
    <div className={styles.container}>
      <div className={styles.workingHours}>
        <Clock size={18} />
        <div>
          <span className={styles.label}>Сегодня {today}</span>
          <span className={styles.hours}>{info.hours}</span>
        </div>
      </div>
      {info.isSpecialDay && info.specialMessage && (
        <div className={styles.specialDay}>
          <AlertCircle size={14} />
          <span>{info.specialMessage}</span>
        </div>
      )}
    </div>
  );
}