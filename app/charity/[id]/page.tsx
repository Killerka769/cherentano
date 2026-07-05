'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Heart, MapPin, Clock, AlertCircle, 
  Sunrise, Sun, Moon, Users, Phone, Calendar,
  ShoppingCart, ChevronRight, CheckCircle, XCircle
} from 'lucide-react';
import ImageWithFallback from '@/app/components/ui/ImageWithFallback/ImageWithFallback';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface Beneficiary {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string | null;
  needs: string;
  urgency: string;
  imageUrl: string | null;
  isActive: boolean;
  isCompleted: boolean;
  helpRequests: { id: string; mealTime: string; deliveredAt: string; status: string }[];
}

const urgencyColors: Record<string, string> = {
  'Нормальный': '#4caf50',
  'Срочный': '#ff9800',
  'Критический': '#f44336'
};

const urgencyIcons: Record<string, string> = {
  'Нормальный': '🟢',
  'Срочный': '🟡',
  'Критический': '🔴'
};

const mealTimes = [
  { value: 'BREAKFAST', label: '🌅 Завтрак', time: '08:00-11:00', icon: Sunrise },
  { value: 'LUNCH', label: '☀️ Обед', time: '12:00-16:00', icon: Sun },
  { value: 'DINNER', label: '🌙 Ужин', time: '18:00-22:00', icon: Moon }
];

export default function CharityDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState('LUNCH');
  const [isHelping, setIsHelping] = useState(false);
  const [existingHelp, setExistingHelp] = useState<{ mealTime: string }[]>([]);

  const id = params?.id as string;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/charity');
      return;
    }
    if (id) {
      fetchBeneficiary();
    }
  }, [user, loading, id]);

  const fetchBeneficiary = async () => {
    try {
      const res = await fetch(`/api/charity/beneficiaries/${id}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Ошибка загрузки');
        router.push('/charity');
        return;
      }
      setBeneficiary(data.beneficiary);
      // Сохраняем уже оказанную помощь
      if (data.beneficiary.helpRequests) {
        setExistingHelp(data.beneficiary.helpRequests);
      }
    } catch (error) {
      console.error('Failed to fetch beneficiary:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHelp = async () => {
    if (!beneficiary) return;
    
    // Проверяем, есть ли товары в корзине
    const cartItems = localStorage.getItem('cart');
    const items = cartItems ? JSON.parse(cartItems) : [];
    
    if (items.length === 0) {
      toast.error('Добавьте блюда в корзину, чтобы помочь');
      router.push('/menu');
      return;
    }
    
    setIsHelping(true);
    try {
      const res = await fetch('/api/charity/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiaryId: beneficiary.id,
          mealTime: selectedMeal
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || 'Ошибка создания заявки');
        return;
      }
      
      toast.success('Заявка создана! Переходите к оформлению заказа');
      router.push(`/checkout?charityRequestId=${data.request.id}`);
    } catch (error) {
      toast.error('Ошибка');
    } finally {
      setIsHelping(false);
    }
  };

  // Проверяем, помогали ли уже в это время
  const isMealHelped = (mealValue: string) => {
    return existingHelp.some(h => h.mealTime === mealValue);
  };

  if (loading || isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  if (!beneficiary) {
    return (
      <div className={styles.notFound}>
        <Heart size={64} />
        <h2>Профиль не найден</h2>
        <p>Возможно, этот человек уже получил помощь</p>
        <Link href="/charity" className={styles.backBtn}>
          <ArrowLeft size={18} />
          Вернуться к списку
        </Link>
      </div>
    );
  }

  const urgency = beneficiary.urgency as keyof typeof urgencyColors;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/charity" className={styles.backLink}>
          <ArrowLeft size={18} />
          Назад к списку
        </Link>
      </div>

      <div className={styles.card}>
        <div className={styles.cardImage}>
          <ImageWithFallback
            src={beneficiary.imageUrl || ''}
            alt={beneficiary.name}
            fallback="default"
          />
          <div className={styles.cardBadges}>
            <span 
              className={styles.urgencyBadge}
              style={{ background: urgencyColors[urgency] }}
            >
              {urgencyIcons[urgency]} {beneficiary.urgency}
            </span>
            <span className={styles.needsBadge}>
              📦 {beneficiary.needs}
            </span>
          </div>
        </div>

        <div className={styles.cardContent}>
          <h1 className={styles.name}>{beneficiary.name}</h1>
          <p className={styles.description}>{beneficiary.description}</p>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <MapPin size={18} />
              <div>
                <div className={styles.infoLabel}>Адрес</div>
                <div className={styles.infoValue}>{beneficiary.address}</div>
              </div>
            </div>
            {beneficiary.phone && (
              <div className={styles.infoItem}>
                <Phone size={18} />
                <div>
                  <div className={styles.infoLabel}>Телефон</div>
                  <div className={styles.infoValue}>{beneficiary.phone}</div>
                </div>
              </div>
            )}
            <div className={styles.infoItem}>
              <Users size={18} />
              <div>
                <div className={styles.infoLabel}>Помощи оказано</div>
                <div className={styles.infoValue}>
                  {beneficiary.helpRequests.filter(r => r.status === 'COMPLETED').length} раз
                </div>
              </div>
            </div>
          </div>

          <div className={styles.mealSection}>
            <h3 className={styles.mealTitle}>🍽️ Выберите время приёма пищи</h3>
            <div className={styles.mealOptions}>
              {mealTimes.map(meal => {
                const isHelped = isMealHelped(meal.value);
                
                return (
                  <button
                    key={meal.value}
                    onClick={() => !isHelped && setSelectedMeal(meal.value)}
                    className={`${styles.mealOption} ${selectedMeal === meal.value ? styles.active : ''} ${isHelped ? styles.disabled : ''}`}
                    disabled={isHelped}
                  >
                    <meal.icon size={20} />
                    <div>
                      <div className={styles.mealLabel}>
                        {meal.label}
                        {isHelped && <span className={styles.helpedBadge}>✅ Уже отправлено</span>}
                      </div>
                      <div className={styles.mealTime}>{meal.time}</div>
                    </div>
                    {selectedMeal === meal.value && !isHelped && (
                      <CheckCircle size={18} className={styles.mealCheck} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.actions}>
            <button 
              onClick={handleHelp}
              disabled={isHelping || beneficiary.isCompleted}
              className={styles.helpBtn}
            >
              <Heart size={20} />
              {isHelping ? 'Оформление...' : 'Помочь сейчас'}
            </button>
            {beneficiary.isCompleted && (
              <div className={styles.completed}>
                <CheckCircle size={20} />
                <span>Этот человек уже получил помощь</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}