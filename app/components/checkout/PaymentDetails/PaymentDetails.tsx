'use client';

import { useState } from 'react';
import { Copy, CheckCircle, Smartphone, Banknote, AlertCircle, User, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './PaymentDetails.module.scss';

interface PaymentDetailsProps {
  amount: number;
  orderId: number;
  type: 'full' | 'deposit' | 'delivery';
  customerName: string;
  customerPhone: string;
  orderItems: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  depositAmount: number;
}

export default function PaymentDetails({ 
  amount, 
  orderId, 
  type, 
  customerName,
  customerPhone,
  orderItems,
  totalAmount,
  depositAmount
}: PaymentDetailsProps) {
  const [copied, setCopied] = useState(false);

  const phone = '79034816223';
  
  const getPaymentTypeText = () => {
    const typeMap = {
      full: 'Полная оплата',
      deposit: 'Аванс 50%',
      delivery: 'Оплата доставки'
    };
    return typeMap[type] || 'Оплата заказа';
  };

  const getPaymentDescription = () => {
    if (type === 'full') {
      return `Оплата заказа #${orderId} (полная стоимость)`;
    }
    if (type === 'deposit') {
      return `Аванс 50% за заказ #${orderId}`;
    }
    return `Оплата доставки для заказа #${orderId}`;
  };

  const itemsList = orderItems.map(item => 
    `${item.name} x${item.quantity} (${item.price * item.quantity} ₽)`
  ).join(', ');

  const fullMessage = `
📋 ОПЛАТА ЗАКАЗА #${orderId}

👤 Клиент: ${customerName}
📞 Телефон: ${customerPhone}
📦 Состав заказа: ${itemsList}

💳 Тип оплаты: ${getPaymentTypeText()}
💰 Сумма к оплате: ${amount} ₽
${type === 'deposit' ? `📌 Остаток к оплате при получении: ${(totalAmount - depositAmount).toFixed(0)} ₽` : ''}

📱 Номер для перевода: +${phone}
📝 Назначение платежа: ${getPaymentDescription()}

✅ После оплаты заказ будет подтверждён менеджером.
`.trim();

  const copyAll = async () => {
    await navigator.clipboard.writeText(fullMessage);
    setCopied(true);
    toast.success('✅ Данные для оплаты скопированы!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <Smartphone size={24} />
        </div>
        <div>
          <h4>Оплата по номеру телефона</h4>
          <p className={styles.subtitle}>
            {type === 'full' && 'Оплатите полную стоимость заказа'}
            {type === 'deposit' && 'Внесите аванс 50% для бронирования'}
            {type === 'delivery' && 'Оплатите доставку'}
          </p>
        </div>
      </div>

      <div className={styles.details}>
        <div className={styles.row}>
          <span className={styles.label}>👤 Клиент</span>
          <span className={styles.value}>{customerName}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>📞 Телефон</span>
          <span className={styles.value}>{customerPhone}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>📦 Заказ</span>
          <span className={styles.value}>#{orderId}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>💳 Тип оплаты</span>
          <span className={`${styles.value} ${styles.paymentType}`}>
            {getPaymentTypeText()}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>💰 Сумма к оплате</span>
          <span className={`${styles.value} ${styles.amount}`}>{amount} ₽</span>
        </div>
        {type === 'deposit' && (
          <div className={styles.row}>
            <span className={styles.label}>📌 Остаток</span>
            <span className={styles.value}>{(totalAmount - depositAmount).toFixed(0)} ₽ при получении</span>
          </div>
        )}
        <div className={styles.row}>
          <span className={styles.label}>📱 Номер</span>
          <span className={styles.value}>+{phone}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>📝 Назначение</span>
          <span className={styles.value}>{getPaymentDescription()}</span>
        </div>
      </div>

      <div className={styles.actions}>
        <button onClick={copyAll} className={styles.copyBtn}>
          {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
          {copied ? 'Скопировано!' : 'Скопировать всё для оплаты'}
        </button>
      </div>

      <div className={styles.note}>
        <AlertCircle size={16} />
        <div>
          <strong>Инструкция по оплате:</strong>
          <ol>
            <li>Откройте приложение вашего банка (Сбер, Т-Банк, ВТБ)</li>
            <li>Выберите «Перевод по номеру телефона»</li>
            <li>Введите номер <strong>+{phone}</strong></li>
            <li>Укажите сумму <strong>{amount} ₽</strong></li>
            <li>В комментарий вставьте скопированный текст или укажите <strong>«{getPaymentDescription()}»</strong></li>
            <li>После оплаты менеджер подтвердит заказ</li>
          </ol>
        </div>
      </div>

      <div className={styles.info}>
        <Banknote size={16} />
        <span>Комиссия банка составляет 0.4% от суммы перевода</span>
      </div>
    </div>
  );
}