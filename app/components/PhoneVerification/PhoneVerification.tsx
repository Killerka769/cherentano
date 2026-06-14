'use client';

import { CheckCircle } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import styles from './PhoneVerification.module.scss';

export default function PhoneVerification() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.phoneVerified) {
    return (
      <div className={styles.verified}>
        <CheckCircle size={20} />
        <span>Телефон подтвержден после успешного заказа</span>
      </div>
    );
  }

  return (
    <div className={styles.warning}>
      <span>📱 Телефон будет автоматически подтвержден после первого выполненного заказа</span>
    </div>
  );
}