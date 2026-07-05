'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Eye, EyeOff, Calendar, Clock, Gift, Sparkles, Flame, Star, Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string;
  link: string | null;
  linkText: string | null;
  type: 'PROMOTION' | 'EVENT' | 'RECOMMEND' | 'HOT' | 'NEW' | 'SPECIAL';
  isActive: boolean;
  sortOrder: number;
  startDate: string | null;
  endDate: string | null;
}

const TYPE_CONFIG = {
  PROMOTION: { label: '🎁 Акция', icon: Gift, color: '#ff9800' },
  EVENT: { label: '📅 Событие', icon: Calendar, color: '#2196f3' },
  RECOMMEND: { label: '⭐ Рекомендуем', icon: Star, color: '#4caf50' },
  HOT: { label: '🔥 Горячее!', icon: Flame, color: '#f44336' },
  NEW: { label: '✨ Новинка', icon: Sparkles, color: '#9c27b0' },
  SPECIAL: { label: '📢 Спецпредложение', icon: Megaphone, color: '#e91e63' }
};

export default function AdminBannersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    imageUrl: '',
    link: '',
    linkText: '',
    type: 'PROMOTION',
    isActive: true,
    sortOrder: 0,
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
      fetchBanners();
    }
  }, [user]);

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/banners');
      const data = await res.json();
      setBanners(data.banners || []);
    } catch (error) {
      console.error('Failed to fetch banners:', error);
      toast.error('Ошибка загрузки баннеров');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.imageUrl) {
      toast.error('Заголовок и изображение обязательны');
      return;
    }
    
    const url = '/api/banners';
    const method = editingBanner ? 'PUT' : 'POST';
    const body = editingBanner 
      ? { id: editingBanner.id, ...formData }
      : formData;
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        toast.success(editingBanner ? 'Баннер обновлен' : 'Баннер добавлен');
        setIsModalOpen(false);
        setEditingBanner(null);
        resetForm();
        fetchBanners();
      } else {
        toast.error('Ошибка сохранения');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      imageUrl: '',
      link: '',
      linkText: '',
      type: 'PROMOTION',
      isActive: true,
      sortOrder: 0,
      startDate: '',
      endDate: ''
    });
  };

  const toggleActive = async (banner: Banner) => {
    try {
      const res = await fetch('/api/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...banner, isActive: !banner.isActive })
      });
      
      if (res.ok) {
        toast.success(banner.isActive ? 'Баннер скрыт' : 'Баннер активирован');
        fetchBanners();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const deleteBanner = async (id: number) => {
    if (!confirm('Удалить баннер?')) return;
    
    try {
      const res = await fetch(`/api/banners?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Баннер удален');
        fetchBanners();
      }
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  const getTypeLabel = (type: string) => {
    return TYPE_CONFIG[type as keyof typeof TYPE_CONFIG]?.label || type;
  };

  const getTypeIcon = (type: string) => {
    const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
    if (!config) return null;
    const Icon = config.icon;
    return <Icon size={14} style={{ color: config.color }} />;
  };

  if (loading || isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🏷️ Управление баннерами</h1>
        <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}>
          <Plus size={18} /> Добавить баннер
        </button>
      </div>

      <div className={styles.grid}>
        {banners.length === 0 ? (
          <div className={styles.empty}>
            <p>Нет баннеров</p>
            <button onClick={() => setIsModalOpen(true)} className={styles.emptyBtn}>
              Создать первый баннер
            </button>
          </div>
        ) : (
          banners.map(banner => (
            <div key={banner.id} className={`${styles.bannerCard} ${!banner.isActive ? styles.inactive : ''}`}>
              <div className={styles.image} style={{ backgroundImage: `url(${banner.imageUrl})` }} />
              <div className={styles.content}>
                <div className={styles.headerRow}>
                  <h3>{banner.title}</h3>
                  <span className={styles.typeBadge}>
                    {getTypeIcon(banner.type)}
                    {getTypeLabel(banner.type)}
                  </span>
                </div>
                {banner.subtitle && <p className={styles.subtitle}>{banner.subtitle}</p>}
                <div className={styles.meta}>
                  <span className={`${styles.status} ${banner.isActive ? styles.active : styles.inactive}`}>
                    {banner.isActive ? '🟢 Активен' : '🔴 Неактивен'}
                  </span>
                  {banner.startDate && (
                    <span className={styles.date}>
                      <Calendar size={14} />
                      {new Date(banner.startDate).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                  {banner.endDate && (
                    <span className={styles.date}>
                      <Clock size={14} />
                      {new Date(banner.endDate).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                </div>
                <div className={styles.actions}>
                  <button onClick={() => toggleActive(banner)} className={styles.toggleBtn} title={banner.isActive ? 'Скрыть' : 'Показать'}>
                    {banner.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button 
                    onClick={() => {
                      setEditingBanner(banner);
                      setFormData({
                        title: banner.title,
                        subtitle: banner.subtitle || '',
                        description: banner.description || '',
                        imageUrl: banner.imageUrl,
                        link: banner.link || '',
                        linkText: banner.linkText || '',
                        type: banner.type,
                        isActive: banner.isActive,
                        sortOrder: banner.sortOrder,
                        startDate: banner.startDate || '',
                        endDate: banner.endDate || ''
                      });
                      setIsModalOpen(true);
                    }} 
                    className={styles.editBtn}
                    title="Редактировать"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => deleteBanner(banner.id)} className={styles.deleteBtn} title="Удалить">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Модальное окно */}
      {isModalOpen && (
        <div className={styles.modal} onClick={() => {
          setIsModalOpen(false);
          setEditingBanner(null);
          resetForm();
        }}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2>{editingBanner ? '✏️ Редактировать баннер' : '➕ Добавить баннер'}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>Заголовок *</label>
                <input
                  type="text"
                  placeholder="Например: Скидка 20% на всё меню"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className={styles.field}>
                <label>Подзаголовок</label>
                <input
                  type="text"
                  placeholder="Краткое описание"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label>Описание</label>
                <textarea
                  placeholder="Подробное описание"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className={styles.field}>
                <label>URL изображения *</label>
                <input
                  type="text"
                  placeholder="https://example.com/banner.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  required
                />
                {formData.imageUrl && (
                  <div className={styles.imagePreview}>
                    <img src={formData.imageUrl} alt="Preview" />
                  </div>
                )}
              </div>

              <div className={styles.field}>
                <label>Тип баннера</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="PROMOTION">🎁 Акция</option>
                  <option value="EVENT">📅 Событие</option>
                  <option value="RECOMMEND">⭐ Рекомендуем</option>
                  <option value="HOT">🔥 Горячее!</option>
                  <option value="NEW">✨ Новинка</option>
                  <option value="SPECIAL">📢 Спецпредложение</option>
                </select>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Ссылка (опционально)</label>
                  <input
                    type="text"
                    placeholder="/menu или https://..."
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label>Текст кнопки</label>
                  <input
                    type="text"
                    placeholder="Узнать больше"
                    value={formData.linkText}
                    onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    Активен
                  </label>
                </div>
                <div className={styles.field}>
                  <label>Порядок сортировки</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
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

              <div className={styles.modalButtons}>
                <button type="submit" className={styles.saveBtn}>
                  {editingBanner ? 'Сохранить' : 'Добавить'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingBanner(null);
                    resetForm();
                  }} 
                  className={styles.cancelBtn}
                >
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