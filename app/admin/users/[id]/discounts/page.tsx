'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Percent, Tag, Calendar, Clock, Trash2, 
  Edit2, Plus, User, Gift, X, CheckCircle, XCircle,
  Search, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface UserDiscount {
  id: number;
  discountId: number;
  used: boolean;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  discount: {
    id: number;
    code: string;
    name: string;
    description: string | null;
    type: 'PERCENT' | 'FIXED';
    value: number;
    isActive: boolean;
  };
}

interface UserInfo {
  id: string;
  name: string | null;
  email: string;
  phone: string;
}

export default function UserDiscountsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [discounts, setDiscounts] = useState<UserDiscount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<UserDiscount | null>(null);
  const [editExpiresDays, setEditExpiresDays] = useState(30);
  const [searchQuery, setSearchQuery] = useState('');

  // Состояния для создания/выдачи скидки
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'PERCENT',
    value: '',
    minOrderAmount: '',
    maxDiscount: '',
    usageLimit: '1',
    isFirstOrder: false,
    isBirthday: false,
    isActive: true,
    startDate: '',
    endDate: ''
  });
  const [expiresDays, setExpiresDays] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN' && userId) {
      fetchUserInfo();
      fetchUserDiscounts();
    }
  }, [user, userId]);

  const fetchUserInfo = async () => {
    try {
      const res = await fetch(`/api/user/${userId}`);
      const data = await res.json();
      setUserInfo(data.user);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  };

  const fetchUserDiscounts = async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/discounts`);
      const data = await res.json();
      setDiscounts(data.discounts || []);
    } catch (error) {
      console.error('Failed to fetch user discounts:', error);
      toast.error('Ошибка загрузки скидок пользователя');
    } finally {
      setIsLoading(false);
    }
  };

  const createAndGiveDiscount = async () => {
    if (!formData.code || !formData.name || !formData.value) {
      toast.error('Заполните обязательные поля');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Создаём скидку
      const createRes = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isIndividual: true,
          usageLimit: 1
        })
      });

      if (!createRes.ok) {
        const error = await createRes.json();
        throw new Error(error.error || 'Ошибка создания скидки');
      }

      const createData = await createRes.json();
      const discountId = createData.discount.id;

      // 2. Выдаём скидку пользователю
      const giveRes = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          discountId,
          expiresDays
        })
      });

      if (!giveRes.ok) {
        const error = await giveRes.json();
        throw new Error(error.error || 'Ошибка выдачи скидки');
      }

      toast.success('Скидка создана и выдана пользователю!');
      setIsModalOpen(false);
      setFormData({
        code: '',
        name: '',
        description: '',
        type: 'PERCENT',
        value: '',
        minOrderAmount: '',
        maxDiscount: '',
        usageLimit: '1',
        isFirstOrder: false,
        isBirthday: false,
        isActive: true,
        startDate: '',
        endDate: ''
      });
      setExpiresDays(30);
      fetchUserDiscounts();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteUserDiscount = async (userDiscountId: number) => {
    if (!confirm('Удалить эту скидку у пользователя?')) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/discounts`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userDiscountId })
      });

      if (res.ok) {
        toast.success('Скидка удалена');
        fetchUserDiscounts();
      } else {
        toast.error('Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  const extendDiscount = async (userDiscountId: number, days: number) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/discounts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userDiscountId, days })
      });

      if (res.ok) {
        toast.success(`Срок действия продлён на ${days} дней`);
        fetchUserDiscounts();
        setEditingDiscount(null);
      } else {
        toast.error('Ошибка');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('ru-RU');
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const filteredDiscounts = discounts.filter(d => 
    d.discount.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.discount.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/admin/users" className={styles.backLink}>
          <ArrowLeft size={18} />
          Назад к пользователям
        </Link>
        <h1 className={styles.title}>
          <User size={24} />
          Скидки пользователя
        </h1>
        <p className={styles.subtitle}>
          {userInfo?.name || userInfo?.email}
        </p>
      </div>

      <div className={styles.actions}>
        <button onClick={() => setIsModalOpen(true)} className={styles.giveBtn}>
          <Gift size={18} />
          Создать и выдать скидку
        </button>
      </div>

      {discounts.length === 0 ? (
        <div className={styles.empty}>
          <Percent size={48} />
          <p>У пользователя нет скидок</p>
          <button onClick={() => setIsModalOpen(true)} className={styles.emptyBtn}>
            Создать и выдать скидку
          </button>
        </div>
      ) : (
        <>
          <div className={styles.searchBox}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Поиск по коду или названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className={styles.clearSearch}>
                <X size={16} />
              </button>
            )}
          </div>

          <div className={styles.grid}>
            {filteredDiscounts.map(ud => {
              const expired = isExpired(ud.expiresAt);
              const isUsed = ud.used;

              return (
                <div key={ud.id} className={`${styles.card} ${expired ? styles.expired : ''} ${isUsed ? styles.used : ''}`}>
                  <div className={styles.cardHeader}>
                    <div className={styles.code}>{ud.discount.code}</div>
                    <span className={`${styles.status} ${!expired && ud.discount.isActive ? styles.active : styles.inactive}`}>
                      {isUsed ? '✅ Использована' : expired ? '⏰ Истекла' : ud.discount.isActive ? '✅ Активна' : '⛔ Неактивна'}
                    </span>
                  </div>

                  <h3>{ud.discount.name}</h3>
                  {ud.discount.description && (
                    <p className={styles.description}>{ud.discount.description}</p>
                  )}

                  <div className={styles.stats}>
                    <div className={styles.stat}>
                      <Percent size={14} />
                      {ud.discount.type === 'PERCENT' ? `${ud.discount.value}%` : `${ud.discount.value} ₽`}
                    </div>
                    <div className={styles.stat}>
                      <Calendar size={14} />
                      До {formatDate(ud.expiresAt)}
                    </div>
                  </div>

                  <div className={styles.meta}>
                    <span>Выдана: {formatDate(ud.createdAt)}</span>
                    {ud.usedAt && <span>Использована: {formatDate(ud.usedAt)}</span>}
                  </div>

                  <div className={styles.actions}>
                    <button 
                      onClick={() => {
                        setEditingDiscount(ud);
                        setEditExpiresDays(7);
                      }}
                      className={styles.extendBtn}
                      disabled={expired || isUsed}
                    >
                      <Clock size={14} />
                      Продлить
                    </button>
                    <button 
                      onClick={() => deleteUserDiscount(ud.id)}
                      className={styles.deleteBtn}
                    >
                      <Trash2 size={14} />
                      Удалить
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredDiscounts.length === 0 && (
            <div className={styles.noResults}>
              <p>Скидки не найдены</p>
            </div>
          )}
        </>
      )}

      {/* Модальное окно продления */}
      {editingDiscount && (
        <div className={styles.modal} onClick={() => setEditingDiscount(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Продлить скидку</h3>
              <button onClick={() => setEditingDiscount(null)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p><strong>Скидка:</strong> {editingDiscount.discount.name}</p>
              <p><strong>Текущий срок:</strong> {formatDate(editingDiscount.expiresAt)}</p>
              <div className={styles.field}>
                <label>Продлить на (дней):</label>
                <input
                  type="number"
                  value={editExpiresDays}
                  onChange={(e) => setEditExpiresDays(parseInt(e.target.value))}
                  min={1}
                  max={365}
                />
              </div>
              <div className={styles.modalButtons}>
                <button onClick={() => extendDiscount(editingDiscount.id, editExpiresDays)} className={styles.saveBtn}>
                  Продлить
                </button>
                <button onClick={() => setEditingDiscount(null)} className={styles.cancelBtn}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания и выдачи скидки */}
      {isModalOpen && (
        <div className={styles.modal} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>🎁 Создать и выдать скидку</h3>
              <button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label>Код *</label>
                <input
                  type="text"
                  placeholder="ПРОМОКОД"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <div className={styles.field}>
                <label>Название *</label>
                <input
                  type="text"
                  placeholder="Скидка 10%"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.field}>
                <label>Описание</label>
                <textarea
                  placeholder="Описание скидки"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Тип *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="PERCENT">Процент (%)</option>
                    <option value="FIXED">Фиксированная (₽)</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Значение *</label>
                  <input
                    type="number"
                    placeholder={formData.type === 'PERCENT' ? '10' : '100'}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    required
                    min="0"
                  />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Мин. сумма заказа</label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    min="0"
                  />
                </div>
                <div className={styles.field}>
                  <label>Макс. скидка</label>
                  <input
                    type="number"
                    placeholder="500"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    min="0"
                  />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Только первый заказ</label>
                  <select
                    value={formData.isFirstOrder ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isFirstOrder: e.target.value === 'true' })}
                  >
                    <option value="false">Нет</option>
                    <option value="true">Да</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>День рождения</label>
                  <select
                    value={formData.isBirthday ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isBirthday: e.target.value === 'true' })}
                  >
                    <option value="false">Нет</option>
                    <option value="true">Да</option>
                  </select>
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Дата начала</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label>Дата окончания</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label>Срок действия (дней) *</label>
                <input
                  type="number"
                  value={expiresDays}
                  onChange={(e) => setExpiresDays(parseInt(e.target.value))}
                  min={1}
                  max={365}
                  required
                />
              </div>
              <div className={styles.modalButtons}>
                <button 
                  onClick={createAndGiveDiscount} 
                  disabled={isSubmitting}
                  className={styles.saveBtn}
                >
                  <Gift size={16} />
                  {isSubmitting ? 'Создание...' : 'Создать и выдать'}
                </button>
                <button onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}