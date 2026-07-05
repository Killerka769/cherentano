'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Bell, X, Clock, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './OrderReminder.module.scss';

interface OrderItem {
  id: number;
  dishName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  orderType: string;
  total: number;
  paymentType: string;
  paidAmount: number;
  comment: string;
  items: OrderItem[];
  createdAt: string;
  paymentData: any;
}

export default function OrderReminder() {
  const { user } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (user) {
      fetchPendingOrder();
      const interval = setInterval(fetchPendingOrder, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (order) {
      const timer = setInterval(() => {
        const diff = 30 * 60 * 1000 - (Date.now() - new Date(order.createdAt).getTime());
        setTimeLeft(Math.max(0, Math.floor(diff / 1000)));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [order]);

  const fetchPendingOrder = async () => {
    try {
      const res = await fetch('/api/orders/payment');
      const data = await res.json();
      if (data.order) {
        setOrder(data.order);
      } else {
        setOrder(null);
      }
    } catch (error) {
      console.error('Failed to fetch pending order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsPaid = async () => {
    if (!order) return;
    
    try {
      const res = await fetch('/api/orders/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      });
      
      if (res.ok) {
        toast.success('✅ Спасибо! Заказ подтвержден.');
        setOrder(null);
        setIsModalOpen(false);
        router.push('/profile');
      }
    } catch (error) {
      toast.error('Ошибка подтверждения');
    }
  };

  const getPaymentText = () => {
    if (!order) return '';
    const phone = '79034816223';
    const amount = order.paidAmount || order.total;
    const typeLabel = order.orderType === 'DELIVERY' ? 'Доставка' : 'Самовывоз';
    const paymentTypeLabel = order.paymentType === 'deposit' ? 'Аванс 50%' : 'Полная оплата';
    
    return `Перевод по номеру телефона: +7${phone}
Сумма: ${amount.toFixed(2)} ₽
Назначение: Оплата заказа #${order.id} (${typeLabel}, ${paymentTypeLabel}) от ${new Date(order.createdAt).toLocaleDateString('ru-RU')}
Плательщик: ${order.customerName} (${order.customerPhone})
Состав заказа: ${order.items.map(i => `${i.dishName} x${i.quantity}`).join(', ')}
Комментарий: ${order.comment || '—'}`;
  };

  const copyPaymentText = async () => {
    await navigator.clipboard.writeText(getPaymentText());
    setCopied(true);
    toast.success('✅ Данные для оплаты скопированы!');
    setTimeout(() => setCopied(false), 3000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading || !order) return null;

  return (
    <>
      {/* Баннер-напоминание */}
      <div className={styles.reminderBanner} onClick={() => setIsModalOpen(true)}>
        <div className={styles.reminderContent}>
          <Bell size={18} className={styles.reminderIcon} />
          <div>
            <span className={styles.reminderTitle}>Ожидается оплата заказа #{order.id}</span>
            <span className={styles.reminderTime}>
              <Clock size={14} />
              {formatTime(timeLeft)}
            </span>
          </div>
          <button className={styles.reminderClose} onClick={(e) => {
            e.stopPropagation();
            setOrder(null);
          }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Модальное окно с деталями */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Оплата заказа #{order.id}</h2>
              <button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.orderSummary}>
                <div className={styles.summaryRow}>
                  <span>Клиент:</span>
                  <span>{order.customerName}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Телефон:</span>
                  <span>{order.customerPhone}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Тип:</span>
                  <span>{order.orderType === 'DELIVERY' ? 'Доставка' : 'Самовывоз'}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Сумма:</span>
                  <span className={styles.amount}>{order.paidAmount || order.total} ₽</span>
                </div>
              </div>

              <div className={styles.paymentDetailsBlock}>
                <label>Реквизиты для оплаты:</label>
                <div className={styles.paymentText}>
                  <pre>{getPaymentText()}</pre>
                </div>
                <button onClick={copyPaymentText} className={styles.copyBtn}>
                  {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                  {copied ? 'Скопировано!' : 'Скопировать реквизиты'}
                </button>
              </div>

              <div className={styles.timeWarning}>
                <AlertCircle size={16} />
                <span>Осталось времени на оплату: <strong>{formatTime(timeLeft)}</strong></span>
              </div>

              <button onClick={markAsPaid} className={styles.paidBtn}>
                <CheckCircle size={18} />
                Я оплатил, подтвердить заказ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}