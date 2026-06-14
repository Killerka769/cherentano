'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Eye, EyeOff, Table, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface Table {
  id: number;
  number: number;   
  seats: number;
  isActive: boolean;
}

export default function AdminTablesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState({
    number: '',
    seats: '',
    isActive: true
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchTables();
    }
  }, [user]);

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/admin/tables');
      const data = await res.json();
      setTables(data.tables || []);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
      toast.error('Ошибка загрузки столиков');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const url = editingTable 
      ? '/api/admin/tables'
      : '/api/admin/tables';
    
    const method = editingTable ? 'PUT' : 'POST';
    
    const body = editingTable
      ? { id: editingTable.id, ...formData, number: parseInt(formData.number), seats: parseInt(formData.seats) }
      : { ...formData, number: parseInt(formData.number), seats: parseInt(formData.seats) };
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        toast.success(editingTable ? 'Столик обновлен' : 'Столик добавлен');
        setIsModalOpen(false);
        setEditingTable(null);
        setFormData({ number: '', seats: '', isActive: true });
        fetchTables();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Ошибка');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  const toggleActive = async (table: Table) => {
    try {
      const res = await fetch('/api/admin/tables', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: table.id,
          number: table.number,
          seats: table.seats,
          isActive: !table.isActive
        })
      });
      
      if (res.ok) {
        toast.success(table.isActive ? 'Столик скрыт' : 'Столик активирован');
        fetchTables();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const deleteTable = async (id: number, number: number) => {
    if (!confirm(`Удалить столик №${number}?`)) return;
    
    try {
      const res = await fetch(`/api/admin/tables?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Столик удален');
        fetchTables();
      }
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  if (loading || isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <Table size={28} />
          Управление столиками
        </h1>
        <p className={styles.subtitle}>Всего столиков: {tables.length}</p>
        <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}>
          <Plus size={18} />
          Добавить столик
        </button>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{tables.length}</div>
          <div className={styles.statLabel}>Всего столиков</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{tables.filter(t => t.isActive).length}</div>
          <div className={styles.statLabel}>Активных</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{tables.reduce((sum, t) => sum + t.seats, 0)}</div>
          <div className={styles.statLabel}>Всего мест</div>
        </div>
      </div>

      <div className={styles.tablesGrid}>
        {tables.map(table => (
          <div key={table.id} className={`${styles.tableCard} ${!table.isActive ? styles.inactive : ''}`}>
            <div className={styles.tableHeader}>
              <span className={styles.tableNumber}>Столик №{table.number}</span>
              <span className={styles.tableSeats}>
                <Users size={14} />
                {table.seats} места
              </span>
            </div>
            
            <div className={styles.tableStatus}>
              <span className={`${styles.statusBadge} ${table.isActive ? styles.active : styles.inactive}`}>
                {table.isActive ? '🟢 Активен' : '🔴 Неактивен'}
              </span>
            </div>
            
            <div className={styles.tableActions}>
              <button onClick={() => toggleActive(table)} className={styles.toggleBtn} title={table.isActive ? 'Скрыть' : 'Показать'}>
                {table.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button 
                onClick={() => {
                  setEditingTable(table);
                  setFormData({
                    number: table.number.toString(),
                    seats: table.seats.toString(),
                    isActive: table.isActive
                  });
                  setIsModalOpen(true);
                }} 
                className={styles.editBtn}
                title="Редактировать"
              >
                <Edit2 size={16} />
              </button>
              <button onClick={() => deleteTable(table.id, table.number)} className={styles.deleteBtn} title="Удалить">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className={styles.empty}>
          <Table size={48} />
          <p>Нет добавленных столиков</p>
          <button onClick={() => setIsModalOpen(true)} className={styles.emptyBtn}>
            Добавить первый столик
          </button>
        </div>
      )}

      {/* Модальное окно */}
      {isModalOpen && (
        <div className={styles.modal} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2>{editingTable ? 'Редактировать столик' : 'Добавить столик'}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>Номер столика</label>
                <input
                  type="number"
                  placeholder="Например: 1"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  required
                  min="1"
                />
              </div>
              
              <div className={styles.field}>
                <label>Количество мест</label>
                <input
                  type="number"
                  placeholder="Например: 4"
                  value={formData.seats}
                  onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                  required
                  min="1"
                  max="20"
                />
              </div>
              
              <div className={styles.field}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Столик активен (доступен для бронирования)
                </label>
              </div>
              
              <div className={styles.modalButtons}>
                <button type="submit" className={styles.saveBtn}>
                  {editingTable ? 'Сохранить' : 'Добавить'}
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