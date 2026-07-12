'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Heart, User, MapPin, Clock, AlertCircle, 
  Sunrise, Sun, Moon, ChevronRight, Users,
  History, List, Plus,
  X
} from 'lucide-react';
import ImageWithFallback from '@/app/components/ui/ImageWithFallback/ImageWithFallback';
import styles from './page.module.scss';

interface Beneficiary {
  id: string;
  name: string;
  description: string;
  address: string;
  needs: string;
  urgency: string;
  imageUrl: string | null;
  helpRequests: { deliveredAt: string }[];
}

interface HelpHistory {
  id: string;
  beneficiaryId: string;
  userId: string;
  mealTime: string;
  amount: number;
  items: any;
  createdAt: string;
  user: { name: string } | null;
  beneficiary: { name: string; imageUrl: string | null };
}

const urgencyColors: Record<string, string> = {
  'Нормальный': '#4caf50',
  'Срочный': '#ff9800',
  'Критический': '#f44336'
};

const mealLabels: Record<string, string> = {
  BREAKFAST: '🌅 Завтрак',
  LUNCH: '☀️ Обед',
  DINNER: '🌙 Ужин'
};

export default function CharityPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [history, setHistory] = useState<HelpHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'history'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/charity');
      return;
    }
    fetchBeneficiaries();
    fetchHistory();
  }, [user, loading]);

  const fetchBeneficiaries = async () => {
    try {
      const res = await fetch('/api/charity/beneficiaries');
      const data = await res.json();
      setBeneficiaries(data.beneficiaries || []);
    } catch (error) {
      console.error('Failed to fetch beneficiaries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/charity/history');
      const data = await res.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  if (loading || isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Heart size={28} className={styles.titleIcon} />
            Накорми нуждающегося
          </h1>
          <p className={styles.subtitle}>
            Помогите тем, кто нуждается в поддержке
          </p>
        </div>
        <button 
          onClick={() => setShowHelpModal(true)} 
          className={styles.howToBtn}
        >
          <Plus size={18} />
          Как помочь?
        </button>
        <Link href="/charity/history" className={styles.historyBtn}>
        <History size={18} />
        История общей помощи
        </Link>
      </div>

      {/* Вкладки */}
      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab('list')}
          className={`${styles.tab} ${activeTab === 'list' ? styles.active : ''}`}
        >
          <List size={18} />
          Кому помочь ({beneficiaries.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
        >
          <History size={18} />
          История помощи ({history.length})
        </button>
      </div>

      {/* Список нуждающихся */}
      {activeTab === 'list' && (
        <>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{beneficiaries.length}</div>
              <div className={styles.statLabel}>Нуждающихся</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {beneficiaries.filter(b => b.urgency === 'Критический').length}
              </div>
              <div className={styles.statLabel}>Критическая ситуация</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {history.length}
              </div>
              <div className={styles.statLabel}>Помощи оказано</div>
            </div>
          </div>

          {beneficiaries.length === 0 ? (
            <div className={styles.empty}>
              <Heart size={64} />
              <h3>Сейчас нет активных заявок</h3>
              <p>Все нуждающиеся получили помощь сегодня. Загляните позже!</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {beneficiaries.map(beneficiary => (
                <Link 
                  key={beneficiary.id} 
                  href={`/charity/${beneficiary.id}`}
                  className={styles.card}
                >
                  <div className={styles.cardImage}>
                    <ImageWithFallback
                      src={beneficiary.imageUrl || ''}
                      alt={beneficiary.name}
                      fallback="default"
                    />
                    <span 
                      className={styles.urgencyBadge}
                      style={{ background: urgencyColors[beneficiary.urgency] }}
                    >
                      {beneficiary.urgency}
                    </span>
                  </div>
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardName}>{beneficiary.name}</h3>
                    <p className={styles.cardDescription}>{beneficiary.description}</p>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardNeeds}>📦 {beneficiary.needs}</span>
                      <span className={styles.cardAddress}>
                        <MapPin size={14} />
                        {beneficiary.address}
                      </span>
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={styles.helpCount}>
                        {beneficiary.helpRequests.length} помощь оказана
                      </span>
                      <span className={styles.helpBtn}>
                        Помочь
                        <ChevronRight size={16} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* История помощи */}
      {activeTab === 'history' && (
        <div className={styles.historySection}>
          {history.length === 0 ? (
            <div className={styles.empty}>
              <History size={64} />
              <h3>История помощи пуста</h3>
              <p>Вы ещё не помогали нуждающимся. Станьте первым!</p>
            </div>
          ) : (
            <div className={styles.historyList}>
              {history.map(item => (
                <div key={item.id} className={styles.historyCard}>
                  <div className={styles.historyImage}>
                    <ImageWithFallback
                      src={item.beneficiary.imageUrl || ''}
                      alt={item.beneficiary.name}
                      fallback="default"
                    />
                  </div>
                  <div className={styles.historyContent}>
                    <div className={styles.historyHeader}>
                      <div>
                        <div className={styles.historyName}>{item.beneficiary.name}</div>
                        <div className={styles.historyMeal}>{mealLabels[item.mealTime] || item.mealTime}</div>
                      </div>
                      <div className={styles.historyAmount}>{item.amount} ₽</div>
                    </div>
                    <div className={styles.historyFooter}>
                      <span className={styles.historyHelper}>
                        👤 {item.user?.name || 'Аноним'}
                      </span>
                      <span className={styles.historyDate}>
                        {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showHelpModal && (
        <div className={styles.modalOverlay} onClick={() => setShowHelpModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>❤️ Как помочь нуждающимся?</h3>
              <button onClick={() => setShowHelpModal(false)} className={styles.modalClose}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.helpStep}>
                <span className={styles.helpStepNumber}>1</span>
                <div>
                  <strong>Выберите человека</strong>
                  <p>Посмотрите список нуждающихся и выберите того, кому хотите помочь</p>
                </div>
              </div>
              <div className={styles.helpStep}>
                <span className={styles.helpStepNumber}>2</span>
                <div>
                  <strong>Выберите время приёма пищи</strong>
                  <p>Завтрак (08:00-11:00), Обед (12:00-16:00), Ужин (18:00-22:00)</p>
                </div>
              </div>
              <div className={styles.helpStep}>
                <span className={styles.helpStepNumber}>3</span>
                <div>
                  <strong>Соберите корзину</strong>
                  <p>Добавьте блюда из меню. Корзина должна быть не пустой</p>
                </div>
              </div>
              <div className={styles.helpStep}>
                <span className={styles.helpStepNumber}>4</span>
                <div>
                  <strong>Оформите заказ</strong>
                  <p>Заполните данные и оплатите. Помощь будет доставлена нуждающемуся</p>
                </div>
              </div>
              <div className={styles.helpStep}>
                <span className={styles.helpStepNumber}>5</span>
                <div>
                  <strong>Получите подтверждение</strong>
                  <p>После доставки вы увидите запись в истории помощи</p>
                </div>
              </div>
              <button onClick={() => setShowHelpModal(false)} className={styles.helpModalBtn}>
                Понятно!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}