'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, User, Mail, Phone, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';
import PhoneInput from '@/app/components/ui/PhoneInput/PhoneInput';

interface LastUpdateInfo {
  lastUpdate: string | null;
  remainingDays: number;
}

export default function EditProfilePage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastUpdateInfo, setLastUpdateInfo] = useState<LastUpdateInfo | null>(null);
  const [isFetchingInfo, setIsFetchingInfo] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email,
        phone: user.phone
      });
      fetchLastUpdateInfo();
    }
  }, [user, loading, router]);

  const fetchLastUpdateInfo = async () => {
    try {
      const res = await fetch('/api/user/last-update');
      const data = await res.json();
      setLastUpdateInfo(data);
    } catch (error) {
      console.error('Failed to fetch last update info:', error);
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Неверный формат email';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Телефон обязателен';
    } else if (!/^\+?[0-9\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Неверный формат телефона';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Проверка на наличие кулдауна
    if (lastUpdateInfo && lastUpdateInfo.remainingDays > 0) {
      toast.error(`Профиль можно обновлять не чаще 1 раза в неделю. Следующее обновление через ${lastUpdateInfo.remainingDays} дн.`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка обновления');
      }
      
      toast.success(data.message || 'Профиль успешно обновлен');
      router.push('/profile');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    // Если телефон верифицирован, запрещаем изменение
    if (user?.phoneVerified) return;
    setFormData({ ...formData, phone: value });
  };

  if (loading || isFetchingInfo) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>Загрузка...</div>
      </div>
    );
  }

  if (!user) return null;

  const canEdit = lastUpdateInfo?.remainingDays === 0 || !lastUpdateInfo?.lastUpdate;
  const nextUpdateDate = lastUpdateInfo?.lastUpdate 
    ? new Date(new Date(lastUpdateInfo.lastUpdate).getTime() + 7 * 24 * 60 * 60 * 1000)
    : null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/profile" className={styles.backLink}>
          <ArrowLeft size={20} />
          Назад в профиль
        </Link>
        <h1 className={styles.title}>Редактирование профиля</h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.card}>
          {/* Информация об ограничениях */}
          <div className={styles.infoBox}>
            <Clock size={20} />
            <div>
              <strong>Ограничение на обновление</strong>
              <p>
                Профиль можно обновлять не чаще 1 раза в неделю.
                {lastUpdateInfo?.lastUpdate && (
                  <span>
                    {' '}Последнее обновление: {new Date(lastUpdateInfo.lastUpdate).toLocaleDateString('ru-RU')}
                    {nextUpdateDate && (
                      <span> • Следующее обновление доступно с {nextUpdateDate.toLocaleDateString('ru-RU')}</span>
                    )}
                  </span>
                )}
                {!lastUpdateInfo?.lastUpdate && (
                  <span> У вас еще не было обновлений — можете изменить данные сейчас!</span>
                )}
              </p>
            </div>
          </div>

          {/* Статус верификации */}
          {user.phoneVerified && (
            <div className={styles.verifiedBox}>
              <CheckCircle size={20} />
              <div>
                <strong>Телефон верифицирован</strong>
                <p>Верифицированный номер телефона нельзя изменить. Для смены номера обратитесь к администратору.</p>
              </div>
            </div>
          )}

          {/* Имя */}
          <div className={styles.field}>
            <label>
              <User size={18} />
              Имя
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ваше имя"
              disabled={!canEdit}
              className={!canEdit ? styles.disabled : ''}
            />
            <p className={styles.hint}>Как к вам обращаться</p>
          </div>

          {/* Email */}
          <div className={styles.field}>
            <label>
              <Mail size={18} />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              required
              disabled={!canEdit}
              className={!canEdit ? styles.disabled : ''}
            />
            {errors.email && <span className={styles.error}>{errors.email}</span>}
            <p className={styles.hint}>Используется для входа в аккаунт</p>
          </div>

          {/* Телефон */}
          <div className={styles.field}>
            <label>
              <Phone size={18} />
              Телефон
            </label>
            <PhoneInput
              value={formData.phone}
              onChange={(value) => setFormData({ ...formData, phone: value })}
              className={styles.input}
              disabled={user?.phoneVerified}
            />
            {user.phoneVerified ? (
              <div className={styles.verifiedInfo}>
                <CheckCircle size={14} />
                <span>Верифицированный номер нельзя изменить</span>
              </div>
            ) : (
              <p className={styles.hint}>
                <AlertCircle size={12} />
                После первого выполненного заказа номер будет верифицирован и его нельзя будет изменить
              </p>
            )}
            {errors.phone && <span className={styles.error}>{errors.phone}</span>}
          </div>

          {/* Статус сохранения */}
          {!canEdit && (
            <div className={styles.warningBox}>
              <AlertCircle size={18} />
              <span>Редактирование временно недоступно. Следующее изменение профиля будет доступно {nextUpdateDate?.toLocaleDateString('ru-RU')}</span>
            </div>
          )}
        </div>

        <div className={styles.buttons}>
          <button 
            type="submit" 
            disabled={isSubmitting || !canEdit} 
            className={styles.saveBtn}
          >
            <Save size={18} />
            {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
          <Link href="/profile" className={styles.cancelBtn}>
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}