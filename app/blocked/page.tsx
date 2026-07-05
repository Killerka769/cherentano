'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Lock, Shield, User, Clock, AlertCircle, LogOut, Calendar } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface BlockInfo {
  isBlocked: boolean;
  blockedUntil: string | null;
  blockReason: string | null;
  blockedBy: string | null;
  blockedAt: string | null;
}

export default function BlockedPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [blockInfo, setBlockInfo] = useState<BlockInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    fetchBlockInfo();
    
    // Проверка каждые 10 секунд (если разблокировали)
    const interval = setInterval(fetchBlockInfo, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (blockInfo?.blockedUntil) {
      const interval = setInterval(() => {
        const diff = new Date(blockInfo.blockedUntil!).getTime() - Date.now();
        if (diff <= 0) {
          setTimeLeft('Срок блокировки истек');
          // Автоматическая проверка разблокировки
          fetchBlockInfo();
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${days}д ${hours}ч ${minutes}м`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [blockInfo]);

  const fetchBlockInfo = async () => {
    try {
      const res = await fetch('/api/auth/block-info');
      const data = await res.json();
      if (data.isBlocked) {
        setBlockInfo(data);
      } else {
        // Если не забанен, перенаправляем на главную
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to fetch block info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Вы вышли из аккаунта');
    router.push('/login');
  };

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

  if (!blockInfo) {
    return null;
  }

  const isPermanent = !blockInfo.blockedUntil;
  const isExpired = blockInfo.blockedUntil && new Date(blockInfo.blockedUntil) < new Date();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <div className={styles.iconRing}>
            <Lock size={48} className={styles.lockIcon} />
          </div>
          <div className={styles.shieldIcon}>
            <Shield size={20} />
          </div>
        </div>

        <h1 className={styles.title}>Аккаунт заблокирован</h1>
        
        <div className={styles.statusBadge}>
          <AlertCircle size={16} />
          {isPermanent ? '🔒 Блокировка навсегда' : isExpired ? '⏳ Срок истек' : '⏳ Временная блокировка'}
        </div>

        {blockInfo.blockReason && (
          <div className={styles.reasonBlock}>
            <h3>Причина блокировки</h3>
            <p className={styles.reason}>{blockInfo.blockReason}</p>
          </div>
        )}

        <div className={styles.infoGrid}>
          {blockInfo.blockedAt && (
            <div className={styles.infoItem}>
              <Calendar size={18} />
              <div>
                <span className={styles.infoLabel}>Дата блокировки</span>
                <span className={styles.infoValue}>
                  {new Date(blockInfo.blockedAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>
          )}

          {blockInfo.blockedBy && (
            <div className={styles.infoItem}>
              <User size={18} />
              <div>
                <span className={styles.infoLabel}>Заблокировал</span>
                <span className={styles.infoValue}>Администратор</span>
              </div>
            </div>
          )}

          {!isPermanent && blockInfo.blockedUntil && !isExpired && (
            <div className={styles.infoItem}>
              <Clock size={18} />
              <div>
                <span className={styles.infoLabel}>Осталось времени</span>
                <span className={styles.infoValue}>{timeLeft}</span>
              </div>
            </div>
          )}

          {isPermanent && (
            <div className={styles.infoItem}>
              <Clock size={18} />
              <div>
                <span className={styles.infoLabel}>Тип блокировки</span>
                <span className={styles.infoValue}>Постоянная</span>
              </div>
            </div>
          )}
        </div>

        {isExpired && blockInfo.blockedUntil && (
          <div className={styles.expiredMessage}>
            <AlertCircle size={20} />
            <div>
              <strong>Срок блокировки истек</strong>
              <p>Вы можете попробовать войти в аккаунт</p>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          {isExpired ? (
            <Link href="/login" className={styles.primaryBtn}>
              Попробовать войти
            </Link>
          ) : (
            <button onClick={handleLogout} className={styles.primaryBtn}>
              <LogOut size={18} />
              Выйти из аккаунта
            </button>
          )}
          
        </div>

        {!isExpired && (
          <p className={styles.footerText}>
            По вопросам разблокировки обратитесь к администратору ресторана
          </p>
        )}
      </div>
    </div>
  );
}