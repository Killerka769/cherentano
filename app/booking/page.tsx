'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Users, Phone, User, Mail, MessageSquare, AlertCircle, Lock, CheckCircle, Copy, Banknote } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';
import PhoneInput from '../components/ui/PhoneInput/PhoneInput';
import ImageWithFallback from '../components/ui/ImageWithFallback/ImageWithFallback';
import TableGallery from '../components/ui/TableGallery/TableGallery';

interface Table {
  id: number;
  number: number;
  seats: number;
  name: string | null;
  description: string | null;
  imageUrl: string | null;
  images: string[] | null;
  purpose: string | null;
  bookings: {
    id: string;
    date: string;
    time: string;
    endTime: string | null;
    status: string;
    customerName: string;
  }[];
}

const BOOKING_PRICE = 1000;
const PAYMENT_PHONE = '79034816223';

export default function BookingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedTableForGallery, setSelectedTableForGallery] = useState<Table | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    date: '',
    time: '19:00',
    endTime: '21:00',
    guests: 2,
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [bookingDuration, setBookingDuration] = useState(2);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'full' | 'deposit'>('full');

  useEffect(() => {
    fetchTables();
    generateAvailableTimes();
  }, []);

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

  const getEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration * 60;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const handleTimeChange = (time: string) => {
    setFormData(prev => ({
      ...prev,
      time: time,
      endTime: getEndTime(time, bookingDuration)
    }));
  };

  const handleDurationChange = (duration: number) => {
    setBookingDuration(duration);
    setFormData(prev => ({
      ...prev,
      endTime: getEndTime(prev.time, duration)
    }));
  };

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

  const getPaymentText = (bookingId: string) => {
    return `Перевод по номеру телефона: +${PAYMENT_PHONE}
Сумма: ${BOOKING_PRICE} ₽
Назначение: Бронирование столика #${bookingId} от ${new Date().toLocaleDateString('ru-RU')}
Плательщик: ${formData.customerName || 'Клиент'} (${formData.customerPhone || 'телефон не указан'})
Дата и время: ${formData.date} в ${formData.time}
Гостей: ${formData.guests}
Комментарий: ${formData.comment || '—'}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      // Создаем бронь со статусом PENDING (ожидает оплаты)
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: selectedTable,
          ...formData,
          endTime: formData.endTime,
          paidAmount: BOOKING_PRICE,
          paymentMethod: 'ONLINE'
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 409) {
          toast.error(`❌ ${data.error}`);
          return;
        }
        throw new Error(data.error || 'Ошибка бронирования');
      }
      
      setCreatedBookingId(data.booking.id);
      setShowPaymentDetails(true);
      toast.success('Бронирование создано! Оплатите 1000 ₽ для подтверждения.');
      
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPaymentText = async () => {
    if (!createdBookingId) return;
    await navigator.clipboard.writeText(getPaymentText(createdBookingId));
    setCopied(true);
    toast.success('✅ Данные для оплаты скопированы!');
    setTimeout(() => setCopied(false), 3000);
  };

  const selectedTableObj = tables.find(t => t.id === selectedTable);
  const isAuthenticated = !!user;

  // Экран с реквизитами для оплаты
  if (showPaymentDetails && createdBookingId) {
    const paymentText = getPaymentText(createdBookingId);

    return (
      <div className={styles.container}>
        <div className={styles.paymentContainer}>
          <div className={styles.paymentHeader}>
            <CheckCircle size={48} className={styles.paymentSuccessIcon} />
            <h2>Бронирование создано!</h2>
            <p>Оплатите 1000 ₽ для подтверждения бронирования</p>
          </div>
          
          <div className={styles.paymentCard}>
            <div className={styles.paymentCardHeader}>
              <Banknote size={20} />
              <span>Реквизиты для оплаты</span>
            </div>
            
            <div className={styles.paymentDetails}>
              <div className={styles.paymentRow}>
                <span className={styles.paymentLabel}>Получатель</span>
                <span className={styles.paymentValue}>Ресторан Челентано</span>
              </div>
              <div className={styles.paymentRow}>
                <span className={styles.paymentLabel}>Телефон</span>
                <span className={styles.paymentValue}>+{PAYMENT_PHONE}</span>
              </div>
              <div className={styles.paymentRow}>
                <span className={styles.paymentLabel}>Сумма</span>
                <span className={`${styles.paymentValue} ${styles.amount}`}>{BOOKING_PRICE} ₽</span>
              </div>
              <div className={styles.paymentRow}>
                <span className={styles.paymentLabel}>Назначение</span>
                <span className={styles.paymentValue}>Бронирование столика #{createdBookingId}</span>
              </div>
            </div>

            <div className={styles.paymentTextBlock}>
              <label>Текст для перевода (скопируйте и вставьте в комментарий)</label>
              <div className={styles.paymentText}>
                <pre>{paymentText}</pre>
              </div>
              <button onClick={copyPaymentText} className={styles.copyPaymentBtn}>
                {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                {copied ? 'Скопировано!' : 'Скопировать текст'}
              </button>
            </div>

            <div className={styles.paymentInstructions}>
              <div className={styles.instruction}>
                <span className={styles.step}>1</span>
                <span>Откройте приложение вашего банка</span>
              </div>
              <div className={styles.instruction}>
                <span className={styles.step}>2</span>
                <span>Выберите «Перевод по номеру телефона»</span>
              </div>
              <div className={styles.instruction}>
                <span className={styles.step}>3</span>
                <span>Вставьте скопированный текст в комментарий</span>
              </div>
              <div className={styles.instruction}>
                <span className={styles.step}>4</span>
                <span>Подтвердите перевод</span>
              </div>
            </div>

            <div className={styles.paymentNote}>
              <AlertCircle size={16} />
              <span>После оплаты менеджер подтвердит бронирование в течение 5-10 минут</span>
            </div>

            <div className={styles.paymentActions}>
              <button 
                onClick={() => {
                  router.push('/profile/bookings');
                }}
                className={styles.paymentCompleteBtn}
              >
                Я оплатил, перейти к моим броням
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Основная форма
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Бронирование столика</h1>
        <p className={styles.subtitle}>
          Забронируйте столик в ресторане Челентано — 
          <strong className={styles.priceHighlight}> {BOOKING_PRICE} ₽</strong>
        </p>
      </div>

      <div className={styles.content}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Выбор столика */}
          <div className={styles.card}>
            <h3>Выберите кабинку</h3>
            <div className={styles.tablesGrid}>
              {tables.map(table => {
                const booked = table.bookings.some(b => 
                  b.date === formData.date && 
                  (b.status === 'CONFIRMED' || b.status === 'PENDING')
                );
                
                return (
                  <div 
                    key={table.id}
                    onClick={() => !booked && setSelectedTable(table.id)}
                    className={`${styles.tableCard} ${selectedTable === table.id ? styles.selected : ''} ${booked ? styles.booked : ''}`}
                  >
                    <div className={styles.tableImage}>
                      <ImageWithFallback
                        src={table.imageUrl || ''}
                        alt={`Кабинка ${table.number}`}
                        fallback="default"
                      />
                      {table.images && table.images.length > 0 && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTableForGallery(table);
                          }}
                          className={styles.galleryBtn}
                        >
                          📷 Смотреть фото
                        </button>
                      )}
                      {booked && (
                        <div className={styles.bookedBadge}>Занято</div>
                      )}
                    </div>
                    <div className={styles.tableInfo}>
                      <div className={styles.tableNumber}>Кабинка №{table.number}</div>
                      {table.name && <div className={styles.tableName}>{table.name}</div>}
                      <div className={styles.tableSeats}>
                        <Users size={14} />
                        {table.seats} места
                      </div>
                      {table.purpose && (
                        <div className={styles.tablePurpose}>🎯 {table.purpose}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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
                onChange={(e) => handleTimeChange(e.target.value)}
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
              <label><Clock size={18} /> Длительность *</label>
              <select
                value={bookingDuration}
                onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                required
                disabled={!isAuthenticated}
                className={!isAuthenticated ? styles.disabled : ''}
              >
                <option value={1}>1 час</option>
                <option value={2}>2 часа</option>
                <option value={3}>3 часа</option>
                <option value={4}>4 часа</option>
                <option value={5}>5 часов</option>
                <option value={6}>6 часов</option>
              </select>
            </div>

            <div className={styles.field}>
              <label><Clock size={18} /> До</label>
              <input
                type="text"
                value={formData.endTime}
                readOnly
                className={styles.endTimeDisplay}
                disabled
              />
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

          {/* Стоимость бронирования */}
          <div className={styles.priceBox}>
            <div className={styles.priceBoxHeader}>
              <Banknote size={20} />
              <span>Стоимость бронирования</span>
            </div>
            <div className={styles.priceBoxContent}>
              <div className={styles.priceAmount}>{BOOKING_PRICE} ₽</div>
              <p className={styles.priceNote}>
                Оплата бронирования гарантирует, что столик будет за вами.
                <br />
                <span className={styles.priceRefund}>
                  💡 При неявке сумма не возвращается
                </span>
              </p>
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
                {isSubmitting ? 'Отправка...' : `Забронировать за ${BOOKING_PRICE} ₽`}
              </button>
            </>
          )}
          
          <p className={styles.note}>
            После оплаты менеджер подтвердит бронирование
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

      {selectedTableForGallery && (
        <TableGallery 
          table={selectedTableForGallery} 
          onClose={() => setSelectedTableForGallery(null)} 
        />
      )}
    </div>
  );
}