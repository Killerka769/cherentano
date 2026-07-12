'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/app/contexts/CartContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Phone, MapPin, User, MessageSquare, CreditCard, 
  Store, AlertCircle, Calendar, Clock, Users,
  CheckCircle, Copy, Banknote, Lock,
  Utensils,
  Truck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import styles from './page.module.scss';
import PhoneInput from '../components/ui/PhoneInput/PhoneInput';
import AddressSelector from '../components/checkout/AddressSelector/AddressSelector';

interface FormData {
  name: string;
  phone: string;
  orderType: 'delivery' | 'pickup';
  address: string;
  comment: string;
  paymentType: 'full' | 'deposit';
  needBooking: boolean;
  tableId: number | null;
  bookingGuests: number;
  bookingTime: string;
  bookingEndTime: string;
  bookingDate: string;
}

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhoneAlert, setShowPhoneAlert] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [bookingDuration, setBookingDuration] = useState(2);
  const [tables, setTables] = useState<any[]>([]);
  
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [menuType, setMenuType] = useState<'pickup' | 'delivery'>('pickup');
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    orderType: 'pickup',
    address: '',
    comment: '',
    paymentType: 'full',
    needBooking: false,
    tableId: null,
    bookingGuests: 2,
    bookingTime: '19:00',
    bookingEndTime: '21:00',
    bookingDate: ''
  });

  // Загружаем тип меню из localStorage (блокируем его)
  useEffect(() => {
    const savedType = localStorage.getItem('selectedMenuType');
    if (savedType === 'delivery') {
      setMenuType('delivery');
      setFormData(prev => ({ ...prev, orderType: 'delivery' }));
    } else {
      setMenuType('pickup');
      setFormData(prev => ({ ...prev, orderType: 'pickup' }));
      localStorage.setItem('selectedMenuType', 'pickup');
    }
  }, []);

  // Если тип не выбран — устанавливаем по умолчанию
  useEffect(() => {
    const savedType = localStorage.getItem('selectedMenuType');
    if (!savedType || (savedType !== 'delivery' && savedType !== 'pickup')) {
      localStorage.setItem('selectedMenuType', 'pickup');
      setMenuType('pickup');
    }
  }, []);

  const subtotal = getTotal();
  const isDelivery = menuType === 'delivery';
  const isPickup = menuType === 'pickup';
  const total = subtotal - discountAmount;
  
  const depositAmount = Math.max(total * 0.5, 1000);
  const finalTotal = total;
  const paymentPhone = '79034816223';

  useEffect(() => {
    const discountId = searchParams.get('discountId');
    const discountCode = searchParams.get('discountCode');
    const discountAmountParam = searchParams.get('discountAmount');
    const isIndividual = searchParams.get('isIndividual') === 'true';
    
    if (discountId && discountAmountParam) {
      setAppliedDiscount({
        discountId: parseInt(discountId),
        discountCode: discountCode || '',
        discountAmount: parseFloat(discountAmountParam),
        isIndividual: isIndividual
      });
      setDiscountAmount(parseFloat(discountAmountParam));
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone
      }));
    }
  }, [user]);

  useEffect(() => {
    const times = [];
    for (let hour = 11; hour <= 22; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 22) times.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    setAvailableTimes(times);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormData(prev => ({
      ...prev,
      bookingDate: tomorrow.toISOString().split('T')[0]
    }));
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items, router]);

  useEffect(() => {
    if (isPickup && formData.needBooking) {
      fetchTables();
    }
  }, [isPickup, formData.needBooking]);

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables');
      const data = await res.json();
      setTables(data.tables || []);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    }
  };

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
      bookingTime: time,
      bookingEndTime: getEndTime(time, bookingDuration)
    }));
  };

  const handleDurationChange = (duration: number) => {
    setBookingDuration(duration);
    setFormData(prev => ({
      ...prev,
      bookingEndTime: getEndTime(prev.bookingTime, duration)
    }));
  };

  if (items.length === 0) {
    return null;
  }

  const fireConfetti = () => {
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#c4492c', '#f4a261', '#4caf50', '#2196f3', '#ff9800', '#e91e63'],
      startVelocity: 20,
    });
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5, x: 0.2 },
        startVelocity: 15,
        colors: ['#c4492c', '#ff9800', '#4caf50'],
      });
    }, 200);
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5, x: 0.8 },
        startVelocity: 15,
        colors: ['#f4a261', '#e91e63', '#2196f3'],
      });
    }, 250);
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

  const getPaymentText = (orderId: number) => {
    const orderNumber = orderId || 'XXXX';
    const typeLabel = isDelivery ? 'Доставка' : 'Самовывоз';
    const paymentTypeLabel = formData.paymentType === 'deposit' ? 'Аванс 50%' : 'Полная оплата';
    const amount = formData.paymentType === 'deposit' ? depositAmount : finalTotal;
    
    return `Перевод по номеру телефона: +${paymentPhone}
Сумма: ${amount.toFixed(2)} ₽
Назначение: Оплата заказа #${orderNumber} (${typeLabel}, ${paymentTypeLabel}) от ${new Date().toLocaleDateString('ru-RU')}
Плательщик: ${formData.name || 'Клиент'} (${formData.phone || 'телефон не указан'})
Состав заказа: ${items.map(i => `${i.name} x${i.quantity}`).join(', ')}
Комментарий: ${formData.comment || '—'}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      toast.error('Пожалуйста, заполните имя и телефон');
      return;
    }

    if (isDelivery && !formData.address) {
      toast.error('Пожалуйста, укажите адрес доставки');
      return;
    }

    if (isPickup && formData.needBooking) {
      if (!formData.tableId) {
        toast.error('Пожалуйста, выберите кабинку');
        return;
      }
      if (!formData.bookingDate) {
        toast.error('Пожалуйста, выберите дату бронирования');
        return;
      }
    }

    if (isPickup) {
      setShowPhoneAlert(true);
      return;
    }

    await submitOrder();
  };

  const submitOrder = async () => {
    if (!agreed) {
      toast.error('Необходимо согласие на обработку персональных данных');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const orderData = {
        customerName: formData.name,
        customerPhone: formData.phone,
        orderType: menuType,
        deliveryAddress: isDelivery ? formData.address : null,
        comment: formData.comment,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: finalTotal,
        paidAmount: formData.paymentType === 'deposit' ? depositAmount : finalTotal,
        paymentType: formData.paymentType,
        paymentMethod: 'ONLINE',
        needBooking: isPickup && formData.needBooking,
        tableId: formData.tableId,
        bookingGuests: formData.bookingGuests,
        bookingTime: formData.bookingTime,
        bookingEndTime: formData.bookingEndTime,
        bookingDate: formData.bookingDate,
        discountId: appliedDiscount?.discountId || null,
        discountAmount: discountAmount || 0,
        isIndividualDiscount: appliedDiscount?.isIndividual || false
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.bookingFailed) {
          toast.error(`❌ ${data.error || 'Не удалось забронировать столик. Попробуйте другое время или выберите другую кабинку.'}`);
          return;
        }
        throw new Error(data.error || 'Ошибка при создании заказа');
      }

      setCreatedOrderId(data.order.id);
      setShowPaymentDetails(true);

      fireConfetti();
      
      toast.success('🎉 Заказ успешно оформлен!', {
        duration: 5000,
        icon: '🎉',
      });
      
      if (data.bookingCreated) {
        setTimeout(() => {
          toast.success('🍽️ Столик забронирован! Менеджер свяжется с вами.', {
            duration: 5000,
            icon: '🍽️',
          });
        }, 1000);
      }
      
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

  const copyPaymentText = async () => {
    if (!createdOrderId) return;
    await navigator.clipboard.writeText(getPaymentText(createdOrderId));
    setCopied(true);
    toast.success('✅ Данные для оплаты скопированы!');
    setTimeout(() => setCopied(false), 3000);
  };

  // Экран с реквизитами
  if (showPaymentDetails && createdOrderId) {
    const amount = formData.paymentType === 'deposit' ? depositAmount : finalTotal;
    const paymentText = getPaymentText(createdOrderId);

    return (
      <div className={styles.container}>
        <div className={styles.paymentContainer}>
          <div className={styles.paymentHeader}>
            <CheckCircle size={48} className={styles.paymentSuccessIcon} />
            <h2>Заказ #{createdOrderId} оформлен!</h2>
            <p>{isDelivery ? 'Оплатите доставку для подтверждения' : 'Оплатите заказ для подтверждения'}</p>
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
                <span className={styles.paymentValue}>+{paymentPhone}</span>
              </div>
              <div className={styles.paymentRow}>
                <span className={styles.paymentLabel}>Сумма</span>
                <span className={`${styles.paymentValue} ${styles.amount}`}>{amount.toFixed(2)} ₽</span>
              </div>
              <div className={styles.paymentRow}>
                <span className={styles.paymentLabel}>Тип оплаты</span>
                <span className={styles.paymentValue}>
                  {isDelivery ? 'Полная оплата' : formData.paymentType === 'deposit' ? 'Аванс 50%' : 'Полная оплата'}
                </span>
              </div>
            </div>

            <div className={styles.paymentTextBlock}>
              <label>Текст для перевода</label>
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
              <span>После оплаты менеджер подтвердит заказ в течение 5-10 минут</span>
            </div>

            <div className={styles.paymentActions}>
              <button 
                onClick={() => {
                  clearCart();
                  router.push('/profile');
                }}
                className={styles.paymentCompleteBtn}
              >
                Я оплатил, перейти в профиль
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
      {showPhoneAlert && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalIcon}>
              <AlertCircle size={48} color="#c4492c" />
            </div>
            <h3 className={styles.modalTitle}>Важно!</h3>
            <p className={styles.modalText}>
              {formData.needBooking 
                ? 'Вы выбрали бронирование столика. Наш менеджер свяжется с вами.'
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

      {/* Тип заказа - ЗАБЛОКИРОВАН */}
      <div className={styles.menuTypeIndicator}>
        <div className={styles.menuTypeBadge}>
          {isPickup ? (
            <>
              <Utensils size={16} />
              Заказ в ресторане
              <Lock size={14} className={styles.lockIcon} />
            </>
          ) : (
            <>
              <Truck size={16} />
              Заказ с доставкой
              <Lock size={14} className={styles.lockIcon} />
            </>
          )}
        </div>
        <p className={styles.menuTypeHint}>
          Тип заказа выбран в меню. Изменение недоступно.
        </p>
      </div>

      {appliedDiscount && discountAmount > 0 && (
        <div className={styles.discountBanner}>
          <div className={styles.discountBannerContent}>
            <CheckCircle size={20} className={styles.discountBannerIcon} />
            <div>
              <strong>Скидка применена!</strong>
              <span>Код: {appliedDiscount.discountCode} • Скидка: {discountAmount} ₽</span>
            </div>
          </div>
        </div>
      )}

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

          {/* Способ получения - ЗАБЛОКИРОВАН И СКРЫТ */}
          {isPickup && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Store size={20} />
                Самовывоз
              </h2>
              <div className={styles.lockedInfo}>
                <div className={styles.lockedIcon}>
                  <Utensils size={24} />
                </div>
                <div>
                  <strong>Самовывоз из ресторана</strong>
                  <p>Вы выбрали меню для ресторана. Заказ будет самовывозом.</p>
                  <p className={styles.lockedNote}>
                    <Lock size={12} /> Тип заказа заблокирован и не может быть изменён
                  </p>
                </div>
              </div>
            </div>
          )}

          {isPickup && (
            <div className={styles.pickupInfo}>
              <div className={styles.pickupAddress}>
                <strong>📍 Адрес ресторана:</strong>
                <p>Республика Дагестан, Махачкала, улица Агасиева, 5А</p>
              </div>
              
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
                        onChange={(e) => handleTimeChange(e.target.value)}
                        required
                      >
                        {availableTimes.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.bookingField}>
                      <label>
                        <Clock size={16} />
                        Длительность *
                      </label>
                      <select
                        value={bookingDuration}
                        onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                        required
                      >
                        <option value={1}>1 час</option>
                        <option value={2}>2 часа</option>
                        <option value={3}>3 часа</option>
                        <option value={4}>4 часа</option>
                        <option value={5}>5 часов</option>
                        <option value={6}>6 часов</option>
                      </select>
                    </div>
                    <div className={styles.bookingField}>
                      <label>
                        <Clock size={16} />
                        До
                      </label>
                      <input
                        type="text"
                        value={formData.bookingEndTime}
                        readOnly
                        className={styles.endTimeDisplay}
                      />
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
                    <div className={styles.bookingField}>
                      <label>
                        🪑 Выберите кабинку *
                      </label>
                      <select
                        value={formData.tableId || ''}
                        onChange={(e) => updateField('tableId', parseInt(e.target.value) || null)}
                        required
                      >
                        <option value="">Выберите кабинку</option>
                        {tables.map(table => (
                          <option key={table.id} value={table.id}>
                            №{table.number} {table.name ? `- ${table.name}` : ''} ({table.seats} мест)
                          </option>
                        ))}
                      </select>
                      <p className={styles.tableHint}>
                        Выберите кабинку, которую хотите забронировать
                      </p>
                    </div>
                    {formData.tableId && (
                      <div className={styles.selectedTablePreview}>
                        <div>
                          <div className={styles.selectedTableName}>
                            Кабинка №{tables.find(t => t.id === formData.tableId)?.number}
                            {tables.find(t => t.id === formData.tableId)?.name && (
                              <> — {tables.find(t => t.id === formData.tableId)?.name}</>
                            )}
                          </div>
                          <div className={styles.selectedTableSeats}>
                            {tables.find(t => t.id === formData.tableId)?.seats} места
                          </div>
                          {tables.find(t => t.id === formData.tableId)?.purpose && (
                            <div className={styles.selectedTablePurpose}>
                              🎯 {tables.find(t => t.id === formData.tableId)?.purpose}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Адрес доставки */}
          {isDelivery && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <MapPin size={20} />
                Адрес доставки
              </h2>
              
              <div className={styles.field}>
                <label htmlFor="address">Адрес доставки *</label>
                <AddressSelector
                  value={formData.address}
                  onChange={(value) => updateField('address', value)}
                  onAddressSaved={() => {}}
                />
              </div>
            </div>
          )}

          {/* Тип оплаты */}
          {isPickup && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <CreditCard size={20} />
                Тип оплаты
              </h2>
              
              <div className={styles.paymentTypeOptions}>
                <label className={`${styles.paymentTypeOption} ${formData.paymentType === 'full' ? styles.active : ''}`}>
                  <input
                    type="radio"
                    name="paymentType"
                    value="full"
                    checked={formData.paymentType === 'full'}
                    onChange={(e) => updateField('paymentType', e.target.value as 'full')}
                  />
                  <div>
                    <strong>Полная оплата</strong>
                    <span>{finalTotal} ₽</span>
                  </div>
                </label>
                <label className={`${styles.paymentTypeOption} ${formData.paymentType === 'deposit' ? styles.active : ''}`}>
                  <input
                    type="radio"
                    name="paymentType"
                    value="deposit"
                    checked={formData.paymentType === 'deposit'}
                    onChange={(e) => updateField('paymentType', e.target.value as 'deposit')}
                  />
                  <div>
                    <strong>Аванс 50%</strong>
                    <span>{depositAmount} ₽</span>
                    {depositAmount < finalTotal && (
                      <span className={styles.balanceInfo}>
                        Остаток {(finalTotal - depositAmount).toFixed(0)} ₽ при получении
                      </span>
                    )}
                  </div>
                </label>
              </div>
              
              <p className={styles.paymentTypeHint}>
                {formData.paymentType === 'deposit' 
                  ? `💡 Остаток ${(finalTotal - depositAmount).toFixed(0)} ₽ оплачиваете при получении` 
                  : '💳 Оплачиваете полную сумму'}
              </p>
            </div>
          )}

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
                placeholder={isPickup 
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
            <span>{subtotal} ₽</span>
          </div>
          
          {isDelivery && (
            <div className={styles.deliveryInfoBlock}>
              <Truck size={18} className={styles.deliveryInfoIcon} />
              <div>
                <strong>Доставка такси</strong>
                <p>Оплата производится на месте при получении заказа. Стоимость зависит от расстояния и тарифов такси.</p>
              </div>
            </div>
          )}

          {discountAmount > 0 && (
            <div className={`${styles.summaryRow} ${styles.discountRow}`}>
              <span>Скидка</span>
              <span className={styles.discountValue}>-{discountAmount} ₽</span>
            </div>
          )}
          
          <div className={styles.divider}></div>
          
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>К оплате</span>
            <span>{isPickup && formData.paymentType === 'deposit' ? depositAmount : finalTotal} ₽</span>
          </div>

          {isPickup && formData.paymentType === 'deposit' && (
            <div className={styles.depositNote}>
              Остаток: {(finalTotal - depositAmount).toFixed(0)} ₽ при получении
            </div>
          )}

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
            {isSubmitting 
              ? 'Оформление...' 
              : isPickup && formData.paymentType === 'deposit'
                ? `Внести аванс ${depositAmount} ₽`
                : `Оплатить ${finalTotal} ₽`
            }
          </button>
          
          <p className={styles.agreement}>
            Нажимая «{isPickup && formData.paymentType === 'deposit' ? 'Внести аванс' : 'Оплатить'}», вы соглашаетесь с условиями обработки персональных данных
          </p>
        </div>
      </div>
    </div>
  );
}