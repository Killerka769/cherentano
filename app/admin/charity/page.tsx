'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Plus, Edit2, Trash2, Eye, EyeOff, 
  Users, Heart, MapPin, Phone, AlertCircle,
  CheckCircle, XCircle, Clock
} from 'lucide-react';
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
  createdAt: string;
  _count?: { helpRequests: number };
}

const urgencyOptions = ['Нормальный', 'Срочный', 'Критический'];
const needsOptions = ['Продукты', 'Горячий обед', 'Набор', 'Другое'];

const urgencyColors: Record<string, string> = {
  'Нормальный': '#4caf50',
  'Срочный': '#ff9800',
  'Критический': '#f44336'
};

export default function AdminCharityPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    needs: 'Продукты',
    urgency: 'Нормальный',
    imageUrl: ''
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchBeneficiaries();
    }
  }, [user]);

  const fetchBeneficiaries = async () => {
    try {
      const res = await fetch('/api/admin/charity/beneficiaries');
      const data = await res.json();
      setBeneficiaries(data.beneficiaries || []);
    } catch (error) {
      console.error('Failed to fetch beneficiaries:', error);
      toast.error('Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.address) {
      toast.error('Заполните обязательные поля');
      return;
    }
    
    const url = editingBeneficiary 
      ? `/api/admin/charity/beneficiaries`
      : '/api/admin/charity/beneficiaries';
    
    const method = editingBeneficiary ? 'PUT' : 'POST';
    
    // Собираем данные без дублирования id
    const bodyData = editingBeneficiary 
      ? { id: editingBeneficiary.id, ...formData }
      : formData;
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      
      if (res.ok) {
        toast.success(editingBeneficiary ? 'Обновлено' : 'Добавлено');
        setIsModalOpen(false);
        setEditingBeneficiary(null);
        setFormData({
          name: '',
          description: '',
          address: '',
          phone: '',
          needs: 'Продукты',
          urgency: 'Нормальный',
          imageUrl: ''
        });
        fetchBeneficiaries();
      } else {
        toast.error('Ошибка');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  const toggleActive = async (beneficiary: Beneficiary) => {
    try {
      const res = await fetch('/api/admin/charity/beneficiaries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: beneficiary.id,
          name: beneficiary.name,
          description: beneficiary.description,
          address: beneficiary.address,
          phone: beneficiary.phone,
          needs: beneficiary.needs,
          urgency: beneficiary.urgency,
          imageUrl: beneficiary.imageUrl,
          isActive: !beneficiary.isActive,
          isCompleted: beneficiary.isCompleted
        })
      });
      
      if (res.ok) {
        toast.success(beneficiary.isActive ? 'Скрыто' : 'Активировано');
        fetchBeneficiaries();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const deleteBeneficiary = async (id: string, name: string) => {
    if (!confirm(`Удалить "${name}"?`)) return;
    
    try {
      const res = await fetch(`/api/admin/charity/beneficiaries?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Удалено');
        fetchBeneficiaries();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  if (loading || isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <Heart size={28} />
          Управление благотворительностью
        </h1>
        <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}>
          <Plus size={18} />
          Добавить нуждающегося
        </button>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{beneficiaries.length}</span>
          <span className={styles.statLabel}>Всего</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>
            {beneficiaries.filter(b => b.isActive && !b.isCompleted).length}
          </span>
          <span className={styles.statLabel}>Активных</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>
            {beneficiaries.filter(b => b.urgency === 'Критический').length}
          </span>
          <span className={styles.statLabel}>Критических</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>
            {beneficiaries.filter(b => b.isCompleted).length}
          </span>
          <span className={styles.statLabel}>Получили помощь</span>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Фото</th>
              <th>Имя</th>
              <th>Нуждается</th>
              <th>Адрес</th>
              <th>Срочность</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {beneficiaries.map(b => (
              <tr key={b.id} className={b.isCompleted ? styles.completed : ''}>
                <td>
                  {b.imageUrl ? (
                    <img src={b.imageUrl} alt={b.name} className={styles.avatar} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      <Users size={20} />
                    </div>
                  )}
                </td>
                <td>
                  <div className={styles.nameCell}>
                    <strong>{b.name}</strong>
                    <span className={styles.needs}>{b.needs}</span>
                  </div>
                </td>
                <td>{b.needs}</td>
                <td className={styles.addressCell}>{b.address}</td>
                <td>
                  <span 
                    className={styles.urgencyBadge}
                    style={{ background: urgencyColors[b.urgency] }}
                  >
                    {b.urgency}
                  </span>
                </td>
                <td>
                  {b.isCompleted ? (
                    <span className={styles.completedBadge}>✅ Помощь оказана</span>
                  ) : b.isActive ? (
                    <span className={styles.activeBadge}>🟢 Активен</span>
                  ) : (
                    <span className={styles.inactiveBadge}>🔴 Неактивен</span>
                  )}
                </td>
                <td className={styles.actions}>
                  <button onClick={() => toggleActive(b)} className={styles.toggleBtn} title={b.isActive ? 'Скрыть' : 'Показать'}>
                    {b.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button 
                    onClick={() => {
                      setEditingBeneficiary(b);
                      setFormData({
                        name: b.name,
                        description: b.description,
                        address: b.address,
                        phone: b.phone || '',
                        needs: b.needs,
                        urgency: b.urgency,
                        imageUrl: b.imageUrl || ''
                      });
                      setIsModalOpen(true);
                    }} 
                    className={styles.editBtn}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => deleteBeneficiary(b.id, b.name)} className={styles.deleteBtn}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {beneficiaries.length === 0 && (
        <div className={styles.empty}>
          <Heart size={48} />
          <p>Нет нуждающихся</p>
          <button onClick={() => setIsModalOpen(true)} className={styles.emptyBtn}>
            Добавить первого
          </button>
        </div>
      )}

      {/* Модальное окно */}
      {isModalOpen && (
        <div className={styles.modal} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2>{editingBeneficiary ? 'Редактировать' : 'Добавить'} нуждающегося</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Имя *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <textarea
                placeholder="Описание ситуации *"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
              />
              <input
                type="text"
                placeholder="Адрес *"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Телефон"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <select
                value={formData.needs}
                onChange={(e) => setFormData({ ...formData, needs: e.target.value })}
              >
                {needsOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
              >
                {urgencyOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="URL фото"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              />
              <div className={styles.modalButtons}>
                <button type="submit" className={styles.saveBtn}>
                  {editingBeneficiary ? 'Сохранить' : 'Добавить'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>
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