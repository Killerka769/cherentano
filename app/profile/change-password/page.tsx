'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

export default function ChangePasswordPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Введите текущий пароль';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'Введите новый пароль';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Пароль должен содержать минимум 6 символов';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Подтвердите новый пароль';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/user/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка смены пароля');
      }
      
      toast.success('Пароль успешно изменен');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      router.push('/profile');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>Загрузка...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/profile" className={styles.backLink}>
          <ArrowLeft size={20} />
          Назад в профиль
        </Link>
        <h1 className={styles.title}>Смена пароля</h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.card}>
          <div className={styles.warning}>
            <Shield size={20} />
            <div>
              <strong>Безопасность аккаунта</strong>
              <p>Используйте надежный пароль, который вы нигде больше не используете</p>
            </div>
          </div>

          {/* Текущий пароль */}
          <div className={styles.field}>
            <label>
              <Lock size={18} />
              Текущий пароль
            </label>
            <div className={styles.passwordInput}>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                placeholder="Введите текущий пароль"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.currentPassword && <span className={styles.error}>{errors.currentPassword}</span>}
          </div>

          {/* Новый пароль */}
          <div className={styles.field}>
            <label>
              <Lock size={18} />
              Новый пароль
            </label>
            <div className={styles.passwordInput}>
              <input
                type={showNew ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="Минимум 6 символов"
              />
              <button type="button" onClick={() => setShowNew(!showNew)}>
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && <span className={styles.error}>{errors.newPassword}</span>}
            <div className={styles.passwordStrength}>
              {formData.newPassword.length > 0 && (
                <span className={formData.newPassword.length >= 6 ? styles.strong : styles.weak}>
                  {formData.newPassword.length >= 6 ? '✅ Надежный пароль' : '⚠️ Слишком короткий пароль'}
                </span>
              )}
            </div>
          </div>

          {/* Подтверждение пароля */}
          <div className={styles.field}>
            <label>
              <Lock size={18} />
              Подтвердите новый пароль
            </label>
            <div className={styles.passwordInput}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Повторите новый пароль"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
            {formData.newPassword && formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
              <span className={styles.match}>✅ Пароли совпадают</span>
            )}
          </div>
        </div>

        <div className={styles.buttons}>
          <button type="submit" disabled={isSubmitting} className={styles.saveBtn}>
            <Lock size={18} />
            {isSubmitting ? 'Смена пароля...' : 'Сменить пароль'}
          </button>
          <Link href="/profile" className={styles.cancelBtn}>
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}