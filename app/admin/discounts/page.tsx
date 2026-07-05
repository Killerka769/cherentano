'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, Edit2, Trash2, Gift, Percent, Tag, Calendar, 
  Users, Clock, Search, X, Trash, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface Discount {
  id: number;
  code: string;
  name: string;
  description: string | null;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  isFirstOrder: boolean;
  isBirthday: boolean;
  isIndividual: boolean;
  startDate: string | null;
  endDate: string | null;
  _count: { usages: number };
  userDiscounts: {
    id: number;
    userId: string;
    used: boolean;
    expiresAt: string | null;
    user: { id: string; name: string | null; email: string };
  }[];
}

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string;
}

export default function AdminDiscountsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDiscounts, setSelectedDiscounts] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Состояния для дарения скидки
  const [isGiftMode, setIsGiftMode] = useState(false);
  const [giftDiscountId, setGiftDiscountId] = useState<number | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [giftExpiresDays, setGiftExpiresDays] = useState(30);
  const [isGiftSubmitting, setIsGiftSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'PERCENT',
    value: '',
    minOrderAmount: '',
    maxDiscount: '',
    usageLimit: '',
    isFirstOrder: false,
    isBirthday: false,
    isIndividual: false,
    isActive: true,
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchDiscounts();
      expireExpiredDiscounts();
    }
  }, [user]);

  useEffect(() => {
    if (isGiftMode && searchUser) {
      fetchUsers();
    }
  }, [searchUser, isGiftMode]);

  const fetchDiscounts = async () => {
    try {
      const res = await fetch('/api/admin/discounts');
      const data = await res.json();
      setDiscounts(data.discounts || []);
    } catch (error) {
      console.error('Failed to fetch discounts:', error);
      toast.error('Ошибка загрузки скидок');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/admin/users?search=${searchUser}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const expireExpiredDiscounts = async () => {
    try {
      const res = await fetch('/api/admin/discounts/expire', {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.deactivatedCount > 0) {
          toast.success(`Деактивировано ${data.deactivatedCount} истекших скидок`);
          fetchDiscounts();
        }
      }
    } catch (error) {
      console.error('Failed to expire discounts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name || !formData.value) {
      toast.error('Заполните обязательные поля');
      return;
    }
    
    const url = '/api/admin/discounts';
    const method = 'POST';
    const body = editingDiscount 
      ? { id: editingDiscount.id, ...formData }
      : formData;
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        const data = await res.json();
        
        if (!editingDiscount && isGiftMode) {
          const newDiscount = data.discount;
          setGiftDiscountId(newDiscount.id);
          
          if (selectedUser) {
            await giveDiscount(newDiscount.id, selectedUser.id);
            return;
          }
          toast.success('Скидка создана! Выберите пользователя для дарения.');
          return;
        }
        
        toast.success(editingDiscount ? 'Скидка обновлена' : 'Скидка создана');
        setIsModalOpen(false);
        setEditingDiscount(null);
        setFormData({
          code: '',
          name: '',
          description: '',
          type: 'PERCENT',
          value: '',
          minOrderAmount: '',
          maxDiscount: '',
          usageLimit: '',
          isFirstOrder: false,
          isBirthday: false,
          isIndividual: false,
          isActive: true,
          startDate: '',
          endDate: ''
        });
        setIsGiftMode(false);
        setGiftDiscountId(null);
        setSelectedUser(null);
        setSearchUser('');
        fetchDiscounts();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Ошибка');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  const giveDiscount = async (discountId: number, userId: string) => {
    setIsGiftSubmitting(true);

    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          discountId,
          expiresDays: giftExpiresDays
        })
      });

      if (res.ok) {
        const userInfo = users.find(u => u.id === userId);
        toast.success(`Скидка подарена ${userInfo?.name || userInfo?.email}`);
        setIsModalOpen(false);
        setIsGiftMode(false);
        setGiftDiscountId(null);
        setSelectedUser(null);
        setSearchUser('');
        setFormData({
          code: '',
          name: '',
          description: '',
          type: 'PERCENT',
          value: '',
          minOrderAmount: '',
          maxDiscount: '',
          usageLimit: '',
          isFirstOrder: false,
          isBirthday: false,
          isIndividual: false,
          isActive: true,
          startDate: '',
          endDate: ''
        });
        fetchDiscounts();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Ошибка дарения');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setIsGiftSubmitting(false);
    }
  };

  const handleGiftSubmit = async () => {
    if (!selectedUser) {
      toast.error('Выберите пользователя');
      return;
    }
    
    if (!giftDiscountId) {
      toast.error('Сначала создайте скидку');
      return;
    }

    await giveDiscount(giftDiscountId, selectedUser.id);
  };

  const toggleActive = async (discount: Discount) => {
    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...discount, isActive: !discount.isActive })
      });
      
      if (res.ok) {
        toast.success(discount.isActive ? 'Скидка деактивирована' : 'Скидка активирована');
        fetchDiscounts();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const deleteDiscount = async (id: number) => {
    if (!confirm('Удалить скидку? Это действие нельзя отменить.')) return;
    
    try {
      const res = await fetch(`/api/admin/discounts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Скидка удалена');
        fetchDiscounts();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  const deleteSelected = async () => {
    if (selectedDiscounts.size === 0) {
      toast.error('Выберите скидки для удаления');
      return;
    }
    
    if (!confirm(`Удалить ${selectedDiscounts.size} скидок?`)) return;
    
    setIsDeleting(true);
    let successCount = 0;
    
    for (const id of selectedDiscounts) {
      try {
        const res = await fetch(`/api/admin/discounts?id=${id}`, { method: 'DELETE' });
        if (res.ok) successCount++;
      } catch (error) {
        console.error('Error deleting discount:', error);
      }
    }
    
    toast.success(`Удалено ${successCount} скидок`);
    setSelectedDiscounts(new Set());
    fetchDiscounts();
    setIsDeleting(false);
  };

  const deleteAllExpired = async () => {
    const expiredIds = discounts
      .filter(d => d.endDate && new Date(d.endDate) < new Date())
      .map(d => d.id);
    
    if (expiredIds.length === 0) {
      toast('Нет истекших скидок', { icon: 'ℹ️' });
      return;
    }
    
    if (!confirm(`Удалить ${expiredIds.length} истекших скидок?`)) return;
    
    setIsDeleting(true);
    let successCount = 0;
    
    for (const id of expiredIds) {
      try {
        const res = await fetch(`/api/admin/discounts?id=${id}`, { method: 'DELETE' });
        if (res.ok) successCount++;
      } catch (error) {
        console.error('Error deleting discount:', error);
      }
    }
    
    toast.success(`Удалено ${successCount} истекших скидок`);
    fetchDiscounts();
    setIsDeleting(false);
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedDiscounts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDiscounts(newSelected);
  };

  const getAvailableUsers = (discount: Discount) => {
    return discount.userDiscounts?.filter(ud => !ud.used) || [];
  };

  const isExpired = (discount: Discount): boolean => {
    if (!discount.endDate) return false;
    return new Date(discount.endDate) < new Date();
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('ru-RU');
  };

  const isDiscountGifted = (discount: Discount): boolean => {
    return getAvailableUsers(discount).length > 0;
  };

  const openGiftMode = (discountId?: number) => {
    setIsGiftMode(true);
    if (discountId) {
      setGiftDiscountId(discountId);
      setIsModalOpen(true);
    } else {
      setEditingDiscount(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        type: 'PERCENT',
        value: '',
        minOrderAmount: '',
        maxDiscount: '',
        usageLimit: '',
        isFirstOrder: false,
        isBirthday: false,
        isIndividual: true,
        isActive: true,
        startDate: '',
        endDate: ''
      });
      setIsModalOpen(true);
    }
  };

  const filteredDiscounts = useMemo(() => {
    return discounts.filter(d => {
      const searchMatch = 
        d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const typeMatch = filterType === 'all' || d.type === filterType;
      
      let statusMatch = true;
      if (filterStatus === 'active') statusMatch = d.isActive;
      else if (filterStatus === 'inactive') statusMatch = !d.isActive;
      else if (filterStatus === 'expired') statusMatch = isExpired(d);
      else if (filterStatus === 'gifted') {
        statusMatch = isDiscountGifted(d);
      }
      
      return searchMatch && typeMatch && statusMatch;
    });
  }, [discounts, searchQuery, filterType, filterStatus]);

  if (loading || isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🎯 Управление скидками</h1>
        <div className={styles.headerActions}>
          <button onClick={expireExpiredDiscounts} className={styles.expireBtn}>
            <Clock size={16} /> Проверить
          </button>
          <button onClick={() => openGiftMode()} className={styles.giftCreateBtn}>
            <Gift size={16} /> Создать и подарить
          </button>
          <button onClick={() => {
            setIsGiftMode(false);
            setGiftDiscountId(null);
            setEditingDiscount(null);
            setFormData({
              code: '',
              name: '',
              description: '',
              type: 'PERCENT',
              value: '',
              minOrderAmount: '',
              maxDiscount: '',
              usageLimit: '',
              isFirstOrder: false,
              isBirthday: false,
              isIndividual: false,
              isActive: true,
              startDate: '',
              endDate: ''
            });
            setIsModalOpen(true);
          }} className={styles.addBtn}>
            <Plus size={18} /> Создать
          </button>
        </div>
      </div>

      <div className={styles.filters}>
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
        
        <div className={styles.filterGroup}>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Все типы</option>
            <option value="PERCENT">Процентные</option>
            <option value="FIXED">Фиксированные</option>
          </select>
          
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
            <option value="expired">Истекшие</option>
            <option value="gifted">🎁 Подаренные</option>
          </select>
        </div>

        <div className={styles.bulkActions}>
          <button onClick={deleteAllExpired} className={styles.bulkDeleteExpired} disabled={isDeleting}>
            <Trash size={16} /> Удалить истекшие
          </button>
          {selectedDiscounts.size > 0 && (
            <button onClick={deleteSelected} className={styles.bulkDelete} disabled={isDeleting}>
              <Trash size={16} /> Удалить ({selectedDiscounts.size})
            </button>
          )}
        </div>
      </div>

      <div className={styles.grid}>
        {filteredDiscounts.map(discount => {
          const availableUsers = getAvailableUsers(discount);
          const expired = isExpired(discount);
          const isSelected = selectedDiscounts.has(discount.id);
          const isGifted = isDiscountGifted(discount);
          
          return (
            <div 
              key={discount.id} 
              className={`${styles.card} ${!discount.isActive || expired ? styles.inactive : ''} ${isSelected ? styles.selected : ''} ${isGifted ? styles.gifted : ''}`}
              onClick={() => toggleSelect(discount.id)}
            >
              <div className={styles.cardHeader}>
                <div className={styles.code}>{discount.code}</div>
                <span className={`${styles.status} ${discount.isActive && !expired ? styles.active : styles.inactive}`}>
                  {expired ? '⏰ Истекла' : discount.isActive ? '✅ Активна' : '⛔ Неактивна'}
                </span>
              </div>
              
              <h3 className={styles.name}>{discount.name}</h3>
              {discount.description && (
                <p className={styles.description}>{discount.description}</p>
              )}
              
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <Percent size={14} />
                  {discount.type === 'PERCENT' ? `${discount.value}%` : `${discount.value} ₽`}
                </div>
                <div className={styles.stat}>
                  <Tag size={14} />
                  Использовано: {discount.usedCount}
                  {discount.usageLimit && ` / ${discount.usageLimit}`}
                </div>
              </div>
              
              <div className={styles.badges}>
                {discount.isFirstOrder && (
                  <span className={styles.badgeFirst}>🎁 Первый заказ</span>
                )}
                {discount.isBirthday && (
                  <span className={styles.badgeBirthday}>🎂 День рождения</span>
                )}
                {discount.isIndividual && (
                  <span className={styles.badgeIndividual}>🎯 Индивидуальная</span>
                )}
                {isGifted && (
                  <span className={styles.badgeGifted}>🎁 Подарена</span>
                )}
                {discount.minOrderAmount && (
                  <span className={styles.badgeMin}>💰 От {discount.minOrderAmount} ₽</span>
                )}
                {discount.startDate && (
                  <span className={styles.badgeDate}>
                    <Calendar size={12} />
                    {formatDate(discount.startDate)}
                  </span>
                )}
                {discount.endDate && (
                  <span className={styles.badgeDate}>
                    <Clock size={12} />
                    {formatDate(discount.endDate)}
                  </span>
                )}
              </div>

              {/* 👇 ПОКАЗЫВАЕМ КОМУ ПОДАРЕНА СКИДКА */}
              {isGifted && (
                <div className={styles.usersList}>
                  <span className={styles.usersLabel}>👤 Подарена ({availableUsers.length}):</span>
                  <div className={styles.usersTags}>
                    {availableUsers.slice(0, 5).map(ud => (
                      <Link 
                        key={ud.id} 
                        href={`/profile/${ud.userId}`}
                        className={styles.userTagLink}
                        onClick={(e) => e.stopPropagation()}
                        target="_blank"
                      >
                        <User size={12} />
                        {ud.user.name || ud.user.email}
                      </Link>
                    ))}
                    {availableUsers.length > 5 && (
                      <Link 
                        href={`/admin/users?discount=${discount.id}`} 
                        className={styles.moreUsersLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        +{availableUsers.length - 5} ещё
                      </Link>
                    )}
                  </div>
                </div>
              )}
              
              <div className={styles.actions}>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleActive(discount); }} 
                  className={styles.toggleBtn}
                >
                  {discount.isActive ? '🔇' : '🔊'}
                </button>
                
                {!isGifted && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); openGiftMode(discount.id); }} 
                    className={styles.giftBtn}
                    title="Подарить эту скидку"
                  >
                    <Gift size={16} />
                  </button>
                )}
                
                <button 
                  onClick={(e) => { 
                    e.stopPropagation();
                    setEditingDiscount(discount);
                    setIsGiftMode(false);
                    setGiftDiscountId(null);
                    setFormData({
                      code: discount.code,
                      name: discount.name,
                      description: discount.description || '',
                      type: discount.type,
                      value: String(discount.value),
                      minOrderAmount: String(discount.minOrderAmount || ''),
                      maxDiscount: String(discount.maxDiscount || ''),
                      usageLimit: String(discount.usageLimit || ''),
                      isFirstOrder: discount.isFirstOrder,
                      isBirthday: discount.isBirthday,
                      isIndividual: discount.isIndividual,
                      isActive: discount.isActive,
                      startDate: discount.startDate || '',
                      endDate: discount.endDate || ''
                    });
                    setIsModalOpen(true);
                  }} 
                  className={styles.editBtn}
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteDiscount(discount.id); }} 
                  className={styles.deleteBtn}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDiscounts.length === 0 && (
        <div className={styles.empty}>
          <Percent size={48} />
          <p>Скидки не найдены</p>
          {searchQuery || filterType !== 'all' || filterStatus !== 'all' ? (
            <button onClick={() => {
              setSearchQuery('');
              setFilterType('all');
              setFilterStatus('all');
            }} className={styles.emptyBtn}>
              Сбросить фильтры
            </button>
          ) : (
            <button onClick={() => {
              setIsGiftMode(false);
              setGiftDiscountId(null);
              setEditingDiscount(null);
              setFormData({
                code: '',
                name: '',
                description: '',
                type: 'PERCENT',
                value: '',
                minOrderAmount: '',
                maxDiscount: '',
                usageLimit: '',
                isFirstOrder: false,
                isBirthday: false,
                isIndividual: false,
                isActive: true,
                startDate: '',
                endDate: ''
              });
              setIsModalOpen(true);
            }} className={styles.emptyBtn}>
              Создать первую скидку
            </button>
          )}
        </div>
      )}

      {/* Модальное окно */}
      {isModalOpen && (
        <div className={styles.modal} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2>
              {isGiftMode && !editingDiscount 
                ? '🎁 Создать и подарить скидку' 
                : editingDiscount 
                  ? '✏️ Редактировать скидку' 
                  : '✨ Создать скидку'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.row}>
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
                  <label>Лимит использований</label>
                  <input
                    type="number"
                    placeholder="100"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    min="0"
                  />
                </div>
                <div className={styles.field}>
                  <label>Активна</label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">Да</option>
                    <option value="false">Нет</option>
                  </select>
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
              
              {isGiftMode && !editingDiscount && (
                <div className={styles.giftSection}>
                  <div className={styles.giftDivider}>
                    <span>🎁 Подарить пользователю</span>
                  </div>
                  
                  <div className={styles.giftUserSearch}>
                    <div className={styles.giftSearchBox}>
                      <Search size={16} />
                      <input
                        type="text"
                        placeholder="Поиск пользователя..."
                        value={searchUser}
                        onChange={(e) => setSearchUser(e.target.value)}
                      />
                    </div>
                    
                    <div className={styles.giftUsersList}>
                      {users.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setSelectedUser(u)}
                          className={`${styles.giftUserItem} ${selectedUser?.id === u.id ? styles.selected : ''}`}
                        >
                          <div className={styles.giftUserAvatar}>
                            {u.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div>{u.name || 'Без имени'}</div>
                            <div className={styles.giftUserEmail}>{u.email}</div>
                          </div>
                          {selectedUser?.id === u.id && (
                            <span className={styles.giftUserCheck}>✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                    
                    <div className={styles.giftSettings}>
                      <label>
                        <Clock size={14} />
                        Срок действия (дней)
                      </label>
                      <input
                        type="number"
                        value={giftExpiresDays}
                        onChange={(e) => setGiftExpiresDays(parseInt(e.target.value))}
                        min={1}
                        max={365}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className={styles.modalButtons}>
                {isGiftMode && !editingDiscount ? (
                  <>
                    <button 
                      type="submit" 
                      className={styles.createAndGiftBtn}
                      disabled={!selectedUser && isGiftMode}
                    >
                      <Gift size={16} /> Создать и подарить
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsGiftMode(false)} 
                      className={styles.cancelBtn}
                    >
                      Без дарения
                    </button>
                  </>
                ) : (
                  <button type="submit" className={styles.saveBtn}>
                    {editingDiscount ? 'Сохранить' : 'Создать'}
                  </button>
                )}
                <button type="button" onClick={() => {
                  setIsModalOpen(false);
                  setIsGiftMode(false);
                  setGiftDiscountId(null);
                  setSelectedUser(null);
                  setSearchUser('');
                }} className={styles.cancelBtn}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}