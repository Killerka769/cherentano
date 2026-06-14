'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Users, Phone, User, Mail, MessageSquare, AlertCircle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';
import PhoneInput from '../components/ui/PhoneInput/PhoneInput';

interface Table {
  id: number;
  number: number;
  seats: number;
}

export default function BookingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    date: '',
    time: '19:00',
    guests: 2,
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);

  // Загружаем столики (доступно всем)
  useEffect(() => {
    fetchTables();
    generateAvailableTimes();
  }, []);

  // Если пользователь авторизован - подставляем его данные
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: user.name || '',
        customerEmail: user.email,
        customerPhone: user.phone
      }));
    }
  }, [user]);

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables');
      const data = await res.json();
      setTables(data.tables || []);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    }
  };

  const generateAvailableTimes = () => {
    const times = [];
    for (let hour = 11; hour <= 22; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 22) times.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    setAvailableTimes(times);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверка авторизации при отправке
    if (!user) {
      toast.error('Для бронирования столика необходимо войти в аккаунт');
      router.push('/login?redirect=/booking');
      return;
    }
    
    if (!selectedTable) {
      toast.error('Выберите столик');
      return;
    }
    
    if (!formData.customerName || !formData.customerPhone || !formData.date || !formData.time) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    if (!agreed) {
      toast.error('Необходимо согласие на обработку персональных данных');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: selectedTable,
          ...formData
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка бронирования');
      }
      
      toast.success('Бронирование отправлено! Менеджер свяжется с вами для подтверждения.');
      router.push('/profile/bookings');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTableObj = tables.find(t => t.id === selectedTable);
  const isAuthenticated = !!user;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Бронирование столика</h1>
        <p className={styles.subtitle}>Забронируйте столик в ресторане Челентано</p>
      </div>

      <div className={styles.content}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.card}>
            <h3>Выберите столик</h3>
            <div className={styles.tablesGrid}>
              {tables.map(table => (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => setSelectedTable(table.id)}
                  className={`${styles.tableCard} ${selectedTable === table.id ? styles.selected : ''}`}
                >
                  <div className={styles.tableNumber}>Столик №{table.number}</div>
                  <div className={styles.tableSeats}>
                    <Users size={14} />
                    {table.seats} места
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Если пользователь не авторизован - показываем предупреждение и блокируем форму */}
          {!isAuthenticated && (
            <div className={styles.authWarning}>
              <Lock size={24} />
              <div>
                <strong>Для бронирования необходимо войти в аккаунт</strong>
                <p>Войдите или зарегистрируйтесь, чтобы забронировать столик</p>
              </div>
              <div className={styles.authButtons}>
                <a href="/login?redirect=/booking" className={styles.loginBtnSmall}>Войти</a>
                <a href="/register" className={styles.registerBtnSmall}>Регистрация</a>
              </div>
            </div>
          )}

          <div className={styles.card}>
            <h3>Контактные данные</h3>
            
            <div className={styles.field}>
              <label><User size={18} /> Ваше имя *</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Иван Иванов"
                required
                disabled={!isAuthenticated}
                className={!isAuthenticated ? styles.disabled : ''}
              />
            </div>
            
            <div className={styles.field}>
              <label><Phone size={18} /> Телефон *</label>
              <PhoneInput
                value={formData.customerPhone}
                onChange={(value) => setFormData({ ...formData, customerPhone: value })}
                required
                className={styles.input}
                disabled={!isAuthenticated}
              />
            </div>
            
            <div className={styles.field}>
              <label><Mail size={18} /> Email</label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                placeholder="your@email.com"
                disabled={!isAuthenticated}
                className={!isAuthenticated ? styles.disabled : ''}
              />
            </div>
          </div>

          <div className={styles.card}>
            <h3>Детали бронирования</h3>
            
            <div className={styles.field}>
              <label><Calendar size={18} /> Дата *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
                disabled={!isAuthenticated}
                className={!isAuthenticated ? styles.disabled : ''}
              />
            </div>
            
            <div className={styles.field}>
              <label><Clock size={18} /> Время *</label>
              <select
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
                disabled={!isAuthenticated}
                className={!isAuthenticated ? styles.disabled : ''}
              >
                {availableTimes.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.field}>
              <label><Users size={18} /> Количество гостей *</label>
              <input
                type="number"
                value={formData.guests}
                onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                min={1}
                max={selectedTableObj?.seats || 10}
                required
                disabled={!isAuthenticated}
                className={!isAuthenticated ? styles.disabled : ''}
              />
              {selectedTableObj && formData.guests > selectedTableObj.seats && (
                <div className={styles.warning}>
                  <AlertCircle size={14} />
                  Столик рассчитан максимум на {selectedTableObj.seats} гостей
                </div>
              )}
            </div>
            
            <div className={styles.field}>
              <label><MessageSquare size={18} /> Комментарий</label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Особые пожелания, аллергии, детский стульчик..."
                rows={3}
                disabled={!isAuthenticated}
                className={!isAuthenticated ? styles.disabled : ''}
              />
            </div>
          </div>

          {isAuthenticated && (
            <>
              <div className={styles.agreement}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    required
                  />
                  <span>
                    Я согласен(на) на <a href="/privacy" target="_blank">обработку персональных данных</a>
                  </span>
                </label>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className={styles.submitBtn}
              >
                {isSubmitting ? 'Отправка...' : 'Забронировать столик'}
              </button>
            </>
          )}
          
          <p className={styles.note}>
            После бронирования с вами свяжется менеджер для подтверждения
          </p>
        </form>

        <div className={styles.info}>
          <div className={styles.infoCard}>
            <h3>📞 Или позвоните нам</h3>
            <a href="tel:+79882938907" className={styles.phoneLink}>
              +7 (988) 293-89-07
            </a>
            <p>Ежедневно с 11:00 до 23:00</p>
          </div>
          
          <div className={styles.infoCard}>
            <h3>📍 Адрес</h3>
            <p>Махачкала, ул. Агасиева, 5А</p>
            <p>10 уютных кабинок для вашего комфорта</p>
          </div>
        </div>
      </div>
    </div>
  );
}