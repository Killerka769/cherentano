'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Plus, Edit2, Trash2, Eye, EyeOff, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface LoadInterval {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  loadLevel: number;
  comment: string | null;
  isActive: boolean;
}

export default function AdminLoadIntervalsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [intervals, setIntervals] = useState<LoadInterval[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInterval, setEditingInterval] = useState<LoadInterval | null>(null);
  const [formData, setFormData] = useState({
    startTime: '12:00',
    endTime: '14:00',
    loadLevel: 5,
    comment: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER'))) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'MANAGER')) {
      fetchIntervals();
    }
  }, [user, selectedDate, filter]);

  const fetchIntervals = async () => {
    try {
      const status = filter === 'all' ? '' : filter;
      const res = await fetch(`/api/admin/load-intervals?date=${selectedDate}&status=${status}`);
      const data = await res.json();
      setIntervals(data.intervals || []);
    } catch (error) {
      console.error('Failed to fetch intervals:', error);
      toast.error('Ошибка загрузки интервалов');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.startTime >= formData.endTime) {
      toast.error('Время начала должно быть раньше времени окончания');
      return;
    }
    
    setIsSubmitting(true);
    
    const url = editingInterval 
      ? '/api/admin/load-intervals'
      : '/api/admin/load-intervals';
    
    const method = editingInterval ? 'PUT' : 'POST';
    
    const body = editingInterval
      ? { id: editingInterval.id, ...formData }
      : { ...formData, date: selectedDate };
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        toast.success(editingInterval ? 'Интервал обновлен' : 'Интервал добавлен');
        setIsModalOpen(false);
        setEditingInterval(null);
        setFormData({ startTime: '12:00', endTime: '14:00', loadLevel: 5, comment: '' });
        fetchIntervals();
      } else {
        const error = await res.json();
        if (res.status === 409) {
          toast.error(`❌ ${error.error}. Интервал: ${error.conflictingInterval?.startTime} - ${error.conflictingInterval?.endTime}`);
        } else {
          toast.error(error.error || 'Ошибка');
        }
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (interval: LoadInterval) => {
    try {
      const res = await fetch('/api/admin/load-intervals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: interval.id,
          startTime: interval.startTime,
          endTime: interval.endTime,
          loadLevel: interval.loadLevel,
          comment: interval.comment,
          isActive: !interval.isActive
        })
      });
      
      if (res.ok) {
        toast.success(interval.isActive ? 'Интервал скрыт' : 'Интервал активирован');
        fetchIntervals();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const deleteInterval = async (id: number) => {
    if (!confirm('Удалить интервал?')) return;
    
    try {
      const res = await fetch(`/api/admin/load-intervals?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Интервал удален');
        fetchIntervals();
      }
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  const getLoadLabel = (level: number) => {
    if (level <= 2) return { label: 'Низкая', color: '#4caf50', bg: 'rgba(76,175,80,0.15)' };
    if (level <= 5) return { label: 'Средняя', color: '#ff9800', bg: 'rgba(255,152,0,0.15)' };
    if (level <= 8) return { label: 'Высокая', color: '#f44336', bg: 'rgba(244,67,54,0.15)' };
    return { label: 'Максимальная', color: '#d32f2f', bg: 'rgba(211,47,47,0.15)' };
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  if (loading || isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Clock size={28} />
            Загруженность кухни
          </h1>
          <p className={styles.subtitle}>Управление интервалами загруженности</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}>
          <Plus size={18} />
          Добавить интервал
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.dateFilter}>
          <button onClick={() => changeDate(-1)} className={styles.dateNavBtn}>
            <ChevronLeft size={18} />
          </button>
          <div className={styles.dateDisplay}>
            <Calendar size={18} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button onClick={() => changeDate(1)} className={styles.dateNavBtn}>
            <ChevronRight size={18} />
          </button>
          <button 
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setSelectedDate(today);
            }} 
            className={styles.todayBtn}
          >
            Сегодня
          </button>
        </div>
        <div className={styles.statusFilter}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Все</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
          </select>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{intervals.length}</span>
          <span className={styles.statLabel}>Всего интервалов</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{intervals.filter(i => i.isActive).length}</span>
          <span className={styles.statLabel}>Активных</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>
            {intervals.length > 0 ? Math.round(intervals.reduce((sum, i) => sum + i.loadLevel, 0) / intervals.length) : 0}
          </span>
          <span className={styles.statLabel}>Средняя загрузка</span>
        </div>
      </div>

      <div className={styles.intervalsList}>
        {intervals.length === 0 ? (
          <div className={styles.empty}>
            <Clock size={48} />
            <p>Нет интервалов на выбранную дату</p>
            <button onClick={() => setIsModalOpen(true)} className={styles.emptyBtn}>
              Добавить первый интервал
            </button>
          </div>
        ) : (
          intervals.map(interval => {
            const loadInfo = getLoadLabel(interval.loadLevel);
            
            return (
              <div key={interval.id} className={`${styles.intervalCard} ${!interval.isActive ? styles.inactive : ''}`}>
                <div className={styles.intervalHeader}>
                  <div className={styles.intervalTime}>
                    <Clock size={18} className={styles.timeIcon} />
                    <span className={styles.timeRange}>
                      {interval.startTime} — {interval.endTime}
                    </span>
                  </div>
                  <span 
                    className={`${styles.levelBadge}`}
                    style={{ background: loadInfo.bg, color: loadInfo.color }}
                  >
                    {loadInfo.label} ({interval.loadLevel}/10)
                  </span>
                  <span className={`${styles.statusBadge} ${interval.isActive ? styles.active : styles.inactive}`}>
                    {interval.isActive ? '🟢 Активен' : '🔴 Неактивен'}
                  </span>
                </div>
                
                <div className={styles.intervalBody}>
                  <div className={styles.loadLevelBar}>
                    <div 
                      className={styles.loadLevelFill}
                      style={{ 
                        width: `${(interval.loadLevel / 10) * 100}%`,
                        background: loadInfo.color
                      }}
                    />
                  </div>
                  
                  {interval.comment && (
                    <div className={styles.commentDisplay}>
                      <AlertCircle size={14} />
                      <span>{interval.comment}</span>
                    </div>
                  )}
                </div>
                
                <div className={styles.intervalActions}>
                  <button 
                    onClick={() => toggleActive(interval)} 
                    className={styles.toggleBtn}
                    title={interval.isActive ? 'Скрыть' : 'Показать'}
                  >
                    {interval.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button 
                    onClick={() => {
                      setEditingInterval(interval);
                      setFormData({
                        startTime: interval.startTime,
                        endTime: interval.endTime,
                        loadLevel: interval.loadLevel,
                        comment: interval.comment || ''
                      });
                      setIsModalOpen(true);
                    }} 
                    className={styles.editBtn}
                    title="Редактировать"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => deleteInterval(interval.id)} 
                    className={styles.deleteBtn}
                    title="Удалить"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Модальное окно */}
      {isModalOpen && (
        <div className={styles.modal} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingInterval ? 'Редактировать интервал' : 'Добавить интервал'}</h2>
              <button onClick={() => setIsModalOpen(false)} className={styles.closeModalBtn}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>Время начала *</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              
              <div className={styles.field}>
                <label>Время окончания *</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
              
              <div className={styles.field}>
                <label>Уровень загруженности: <strong>{formData.loadLevel} / 10</strong></label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.loadLevel}
                  onChange={(e) => setFormData({ ...formData, loadLevel: parseInt(e.target.value) })}
                  className={styles.rangeInput}
                />
                <div className={styles.rangeLabels}>
                  <span>😊 Мало заказов</span>
                  <span>🔥 Много заказов</span>
                </div>
              </div>
              
              <div className={styles.field}>
                <label>Комментарий (необязательно)</label>
                <input
                  type="text"
                  placeholder="Например: Большой банкет, много готовим..."
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  maxLength={100}
                />
                <span className={styles.hint}>{formData.comment.length}/100</span>
              </div>
              
              <div className={styles.modalButtons}>
                <button type="submit" disabled={isSubmitting} className={styles.saveBtn}>
                  {isSubmitting ? 'Сохранение...' : editingInterval ? 'Сохранить' : 'Добавить'}
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