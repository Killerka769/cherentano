'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Percent, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './DiscountInput.module.scss';

interface Discount {
  id: number;
  code: string;
  name: string;
  description: string | null;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrderAmount: number | null;
  discountType?: 'common' | 'individual';
  userDiscountId?: number | null;
  expiresAt?: string | null;
  uniqueId?: string;
}

interface DiscountInputProps {
  orderTotal: number;
  items: any[];
  onDiscountApplied: (discount: any) => void;
  onDiscountRemoved: () => void;
  initialDiscount?: any;
}

export default function DiscountInput({ 
  orderTotal, 
  items, 
  onDiscountApplied, 
  onDiscountRemoved,
  initialDiscount = null
}: DiscountInputProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [availableDiscounts, setAvailableDiscounts] = useState<Discount[]>([]);
  const [usedDiscountIds, setUsedDiscountIds] = useState<Set<number>>(new Set());
  const [hasInitialized, setHasInitialized] = useState(false);
  const isApplyingRef = useRef(false);

  useEffect(() => {
    fetchAvailableDiscounts();
    fetchUsedDiscounts();
  }, []);

  // Применяем initialDiscount только один раз при загрузке
  useEffect(() => {
    if (initialDiscount && !hasInitialized && !isApplyingRef.current) {
      isApplyingRef.current = true;
      setAppliedDiscount(initialDiscount);
      // Уведомляем родителя один раз
      onDiscountApplied({
        discountId: initialDiscount.discountId,
        discountCode: initialDiscount.discountCode,
        discountAmount: initialDiscount.discountAmount,
        newTotal: orderTotal - initialDiscount.discountAmount,
        isIndividual: initialDiscount.isIndividual || false
      });
      setHasInitialized(true);
      setTimeout(() => {
        isApplyingRef.current = false;
      }, 0);
    }
  }, [initialDiscount, hasInitialized, orderTotal]);

  const fetchAvailableDiscounts = async () => {
    try {
      const res = await fetch('/api/discounts');
      const data = await res.json();
      setAvailableDiscounts(data.discounts || []);
    } catch (error) {
      console.error('Failed to fetch discounts:', error);
    }
  };

  const fetchUsedDiscounts = async () => {
    try {
      const res = await fetch('/api/discounts/used');
      const data = await res.json();
      setUsedDiscountIds(new Set(data.usedIds || []));
    } catch (error) {
      console.error('Failed to fetch used discounts:', error);
    }
  };

  const applyDiscount = async () => {
    if (!code.trim()) {
      toast.error('Введите код скидки');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/discounts/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: code.trim(), 
          orderTotal,
          items 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Ошибка применения скидки');
        return;
      }

      const discountData = {
        discountId: data.discount.id,
        discountCode: data.discount.code,
        discountAmount: data.discountAmount,
        newTotal: data.newTotal,
        isIndividual: data.discount.isIndividual || false
      };

      setAppliedDiscount(discountData);
      onDiscountApplied(discountData);

      toast.success(`Скидка ${data.discountAmount} ₽ применена!`);
      setCode('');
    } catch (error) {
      toast.error('Ошибка применения скидки');
    } finally {
      setIsLoading(false);
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setHasInitialized(false);
    onDiscountRemoved();
    toast.success('Скидка отменена');
  };

  const quickApply = async (discount: Discount) => {
    if (usedDiscountIds.has(discount.id)) {
      toast.error('Вы уже использовали эту скидку');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/discounts/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          discountId: discount.id,
          orderTotal,
          items 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Ошибка применения скидки');
        return;
      }

      const discountData = {
        discountId: data.discount.id,
        discountCode: data.discount.code,
        discountAmount: data.discountAmount,
        newTotal: data.newTotal,
        isIndividual: data.discount.isIndividual || false
      };

      setAppliedDiscount(discountData);
      onDiscountApplied(discountData);

      toast.success(`Скидка ${data.discountAmount} ₽ применена!`);
    } catch (error) {
      toast.error('Ошибка применения скидки');
    } finally {
      setIsLoading(false);
    }
  };

  const isDiscountExpired = (expiresAt?: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isDiscountUsed = (discountId: number) => {
    return usedDiscountIds.has(discountId);
  };

  return (
    <div className={styles.container}>
      {appliedDiscount ? (
        <div className={styles.applied}>
          <div className={styles.appliedInfo}>
            <CheckCircle size={20} className={styles.successIcon} />
            <div>
              <strong>{appliedDiscount.discountCode || 'Скидка'}</strong>
              <span>Скидка {appliedDiscount.discountAmount} ₽ применена</span>
            </div>
          </div>
          <button onClick={removeDiscount} className={styles.removeBtn}>
            <XCircle size={16} />
            Отменить
          </button>
        </div>
      ) : (
        <div className={styles.inputWrapper}>
          <div className={styles.inputRow}>
            <input
              type="text"
              placeholder="Введите промокод"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={styles.input}
              disabled={isLoading}
            />
            <button 
              onClick={applyDiscount} 
              disabled={isLoading || !code.trim()}
              className={styles.applyBtn}
            >
              {isLoading ? '...' : 'Применить'}
            </button>
          </div>

          {availableDiscounts.length > 0 && (
            <div className={styles.available}>
              <span className={styles.availableLabel}>Доступные скидки:</span>
              <div className={styles.discountTags}>
                {availableDiscounts.map((d) => {
                  const key = d.uniqueId || `discount-${d.id}-${d.discountType || 'common'}`;
                  const isExpired = isDiscountExpired(d.expiresAt);
                  const isUsed = isDiscountUsed(d.id);
                  const isDisabled = isExpired || isUsed;

                  return (
                    <button
                      key={key}
                      onClick={() => !isDisabled && quickApply(d)}
                      className={`${styles.discountTag} ${isDisabled ? styles.disabled : ''}`}
                      disabled={isDisabled}
                      title={isUsed ? 'Скидка уже использована' : isExpired ? 'Срок действия истек' : ''}
                    >
                      {d.discountType === 'individual' ? (
                        <Sparkles size={12} className={styles.individualIcon} />
                      ) : (
                        <Percent size={12} />
                      )}
                      {d.name}
                      {d.discountType === 'individual' && (
                        <span className={styles.individualBadge}>🎯</span>
                      )}
                      {isUsed && (
                        <span className={styles.usedBadge}>✅</span>
                      )}
                      {isExpired && (
                        <span className={styles.expiredBadge}>⏰</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}