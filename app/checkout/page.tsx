'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/app/contexts/CartContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Phone, MapPin, User, MessageSquare, CreditCard, 
  Banknote, Store, AlertCircle, Calendar, Clock, Users, CheckCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import styles from './page.module.scss';
import PhoneInput from '../components/ui/PhoneInput/PhoneInput';

interface FormData {
  name: string;
  phone: string;
  orderType: 'delivery' | 'pickup';
  address: string;
  comment: string;
  paymentMethod: 'cash' | 'card';
  needBooking: boolean;
  bookingGuests: number;
  bookingTime: string;
  bookingDate: string;
}

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhoneAlert, setShowPhoneAlert] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);
  const [agreed, setAgreed] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    orderType: 'delivery',
    address: '',
    comment: '',
    paymentMethod: 'cash',
    needBooking: false,
    bookingGuests: 2,
    bookingTime: '19:00',
    bookingDate: ''
  });

  const total = getTotal();
  const deliveryPrice = formData.orderType === 'pickup' ? 0 : (total > 1000 ? 0 : 150);
  const finalTotal = total + deliveryPrice;

  // Заполняем данные пользователя если авторизован
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone
      }));
    }
  }, [user]);

  // Генерируем доступное время
  useEffect(() => {
    const times = [];
    for (let hour = 11; hour <= 22; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 22) times.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    setAvailableTimes(times);
    
    // Устанавливаем дату на завтра
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormData(prev => ({
      ...prev,
      bookingDate: tomorrow.toISOString().split('T')[0]
    }));
  }, []);

  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  // Функция для запуска конфетти
  const fireConfetti = () => {
    // Первая волна - основной залп
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#c4492c', '#f4a261', '#4caf50', '#2196f3', '#ff9800', '#e91e63'],
      startVelocity: 20,
    });
    
    // Вторая волна - слева
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5, x: 0.2 },
        startVelocity: 15,
        colors: ['#c4492c', '#ff9800', '#4caf50'],
      });
    }, 200);
    
    // Третья волна - справа
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5, x: 0.8 },
        startVelocity: 15,
        colors: ['#f4a261', '#e91e63', '#2196f3'],
      });
    }, 250);
    
    // Четвертая волна - дополнительный залп
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 50,
        origin: { y: 0.7 },
        startVelocity: 10,
        colors: ['#ffd700', '#c4492c', '#fff'],
      });
    }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      toast.error('Пожалуйста, заполните имя и телефон');
      return;
    }

    if (formData.orderType === 'delivery' && !formData.address) {
      toast.error('Пожалуйста, укажите адрес доставки');
      return;
    }

    if (formData.orderType === 'pickup') {
      if (formData.needBooking && !formData.bookingDate) {
        toast.error('Пожалуйста, выберите дату бронирования');
        return;
      }
      setShowPhoneAlert(true);
      return;
    }

    await submitOrder();
  };

  const submitOrder = async () => {
    setIsSubmitting(true);

    try {
      if (!agreed) {
        toast.error('Необходимо согласие на обработку персональных данных');
        return;
      }
      const orderData = {
        customerName: formData.name,
        customerPhone: formData.phone,
        orderType: formData.orderType,
        deliveryAddress: formData.orderType === 'delivery' ? formData.address : null,
        comment: formData.comment,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: finalTotal,
        paymentMethod: formData.paymentMethod,
        needBooking: formData.orderType === 'pickup' && formData.needBooking,
        bookingGuests: formData.bookingGuests,
        bookingTime: formData.bookingTime,
        bookingDate: formData.bookingDate
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при создании заказа');
      }

      // Запускаем эффект конфетти
      fireConfetti();
      
      toast.success('🎉 Заказ успешно оформлен! Спасибо за доверие!', {
        duration: 5000,
        icon: '🎉',
      });
      
      if (data.bookingCreated) {
        setTimeout(() => {
          toast.success('🍽️ Столик забронирован! Менеджер свяжется с вами для подтверждения.', {
            duration: 5000,
            icon: '🍽️',
          });
        }, 1000);
      }
      
      clearCart();
      
      // Небольшая задержка перед редиректом
      setTimeout(() => {
        router.push('/profile');
      }, 2000);
    } catch (error) {
      toast.error('Ошибка при оформлении заказа. Попробуйте позже.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={styles.container}>
      {/* Модальное окно с предупреждением о звонке */}
      {showPhoneAlert && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalIcon}>
              <AlertCircle size={48} color="#c4492c" />
            </div>
            <h3 className={styles.modalTitle}>Важно!</h3>
            <p className={styles.modalText}>
              {formData.needBooking 
                ? 'Вы выбрали бронирование столика. Наш менеджер свяжется с вами для подтверждения.'
                : 'Перед приходом в ресторан рекомендуем позвонить и уточнить наличие свободных столиков.'}
            </p>
            <div className={styles.modalButtons}>
              <a href="tel:+79882938907" className={styles.modalCallBtn}>
                <Phone size={18} />
                Позвонить
              </a>
              <button 
                onClick={() => {
                  setShowPhoneAlert(false);
                  submitOrder();
                }} 
                className={styles.modalContinueBtn}
              >
                Продолжить без звонка
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.header}>
        <Link href="/cart" className={styles.backLink}>
          <ArrowLeft size={20} />
          Вернуться в корзину
        </Link>
        <h1 className={styles.title}>Оформление заказа</h1>
      </div>

      <div className={styles.content}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Контактные данные */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <User size={20} />
              Контактные данные
            </h2>
            
            <div className={styles.field}>
              <label htmlFor="name">Имя *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Введите ваше имя"
                required
              />
            </div>
            
            <div className={styles.field}>
              <label htmlFor="phone">Телефон *</label>
              <PhoneInput
                value={formData.phone}
                onChange={(value) => updateField('phone', value)}
                required
                className={styles.field}
              />
            </div>
          </div>

          {/* Способ получения */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Store size={20} />
              Способ получения
            </h2>
            
            <div className={styles.orderTypes}>
              <label className={`${styles.orderType} ${formData.orderType === 'delivery' ? styles.active : ''}`}>
                <input
                  type="radio"
                  name="orderType"
                  value="delivery"
                  checked={formData.orderType === 'delivery'}
                  onChange={(e) => updateField('orderType', e.target.value as 'delivery')}
                />
                <MapPin size={20} />
                <div>
                  <strong>Доставка</strong>
                  <span>Привезём к вам домой</span>
                </div>
              </label>
              
              <label className={`${styles.orderType} ${formData.orderType === 'pickup' ? styles.active : ''}`}>
                <input
                  type="radio"
                  name="orderType"
                  value="pickup"
                  checked={formData.orderType === 'pickup'}
                  onChange={(e) => updateField('orderType', e.target.value as 'pickup')}
                />
                <Store size={20} />
                <div>
                  <strong>В ресторане</strong>
                  <span>Самовывоз или еда на месте</span>
                </div>
              </label>
            </div>

            {formData.orderType === 'pickup' && (
              <div className={styles.pickupInfo}>
                <div className={styles.pickupAddress}>
                  <strong>📍 Адрес ресторана:</strong>
                  <p>Республика Дагестан, Махачкала, улица Агасиева, 5А</p>
                </div>
                
                {/* Бронирование столика */}
                <div className={styles.bookingSection}>
                  <div className={styles.bookingToggle}>
                    <label className={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={formData.needBooking}
                        onChange={(e) => updateField('needBooking', e.target.checked)}
                      />
                      <span>Забронировать столик в ресторане</span>
                    </label>
                    <p className={styles.bookingHint}>
                      🪑 10 уютных кабинок для вашего комфорта
                    </p>
                  </div>
                  
                  {formData.needBooking && (
                    <div className={styles.bookingOptions}>
                      <div className={styles.bookingField}>
                        <label>
                          <Calendar size={16} />
                          Дата *
                        </label>
                        <input
                          type="date"
                          value={formData.bookingDate}
                          onChange={(e) => updateField('bookingDate', e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                      <div className={styles.bookingField}>
                        <label>
                          <Clock size={16} />
                          Время *
                        </label>
                        <select
                          value={formData.bookingTime}
                          onChange={(e) => updateField('bookingTime', e.target.value)}
                          required
                        >
                          {availableTimes.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.bookingField}>
                        <label>
                          <Users size={16} />
                          Количество гостей *
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={formData.bookingGuests}
                          onChange={(e) => updateField('bookingGuests', parseInt(e.target.value))}
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Адрес доставки */}
          {formData.orderType === 'delivery' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <MapPin size={20} />
                Адрес доставки
              </h2>
              
              <div className={styles.field}>
                <label htmlFor="address">Улица, дом, квартира *</label>
                <input
                  type="text"
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="г. Махачкала, ул. Агасиева, 5А"
                  required={formData.orderType === 'delivery'}
                />
              </div>
            </div>
          )}

          {/* Способ оплаты */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <CreditCard size={20} />
              Способ оплаты
            </h2>
            
            <div className={styles.paymentMethods}>
              <label className={`${styles.paymentMethod} ${formData.paymentMethod === 'cash' ? styles.active : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={formData.paymentMethod === 'cash'}
                  onChange={(e) => updateField('paymentMethod', e.target.value as 'cash')}
                />
                <Banknote size={20} />
                <div>
                  <strong>Наличными</strong>
                  <span>{formData.orderType === 'pickup' ? 'В ресторане' : 'При получении'}</span>
                </div>
              </label>
              
              <label className={`${styles.paymentMethod} ${formData.paymentMethod === 'card' ? styles.active : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={formData.paymentMethod === 'card'}
                  onChange={(e) => updateField('paymentMethod', e.target.value as 'card')}
                />
                <CreditCard size={20} />
                <div>
                  <strong>Картой курьеру</strong>
                  <span>{formData.orderType === 'pickup' ? 'В ресторане' : 'При получении'}</span>
                </div>
              </label>
            </div>
          </div>

          {/* Комментарий */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <MessageSquare size={20} />
              Комментарий к заказу
            </h2>
            
            <div className={styles.field}>
              <textarea
                value={formData.comment}
                onChange={(e) => updateField('comment', e.target.value)}
                placeholder={formData.orderType === 'pickup' 
                  ? "Пожелания, особые указания, количество персон..." 
                  : "Пожелания, особые указания, домофон..."}
                rows={3}
              />
            </div>
          </div>
        </form>

        {/* Итого */}
        <div className={styles.summary}>
          <h3 className={styles.summaryTitle}>Ваш заказ</h3>
          
          <div className={styles.orderItems}>
            {items.map(item => (
              <div key={item.id} className={styles.orderItem}>
                <span>{item.name} x{item.quantity}</span>
                <span>{item.price * item.quantity} ₽</span>
              </div>
            ))}
          </div>
          
          <div className={styles.divider}></div>
          
          <div className={styles.summaryRow}>
            <span>Сумма</span>
            <span>{total} ₽</span>
          </div>
          
          {formData.orderType === 'delivery' && (
            <div className={styles.summaryRow}>
              <span>Доставка</span>
              <span>{deliveryPrice === 0 ? 'Бесплатно' : `${deliveryPrice} ₽`}</span>
            </div>
          )}
          
          {formData.orderType === 'delivery' && deliveryPrice > 0 && (
            <div className={styles.freeDeliveryNote}>
              Закажите ещё на {1000 - total} ₽ для бесплатной доставки
            </div>
          )}
          
          <div className={styles.divider}></div>
          
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>К оплате</span>
            <span>{finalTotal} ₽</span>
          </div>

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
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={styles.submitBtn}
          >
            {isSubmitting ? 'Оформление...' : `Заказать за ${finalTotal} ₽`}
          </button>
          
          <p className={styles.agreement}>
            Нажимая «Заказать», вы соглашаетесь с условиями обработки персональных данных
          </p>
        </div>
      </div>
    </div>
  );
}