'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Eye, EyeOff, Table, Users, Image, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';
import ImageWithFallback from '@/app/components/ui/ImageWithFallback/ImageWithFallback';

interface Table {
  id: number;
  number: number;
  seats: number;
  isActive: boolean;
  name: string | null;
  description: string | null;
  imageUrl: string | null;
  images: string[] | null;
  purpose: string | null;
}

export default function AdminTablesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [imageInput, setImageInput] = useState('');
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    number: '',
    seats: '',
    isActive: true,
    name: '',
    description: '',
    purpose: '',
    imageUrl: '',
    images: [] as string[]
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

  const openModal = (table?: Table) => {
    if (table) {
      setEditingTable(table);
      setFormData({
        number: table.number.toString(),
        seats: table.seats.toString(),
        isActive: table.isActive,
        name: table.name || '',
        description: table.description || '',
        purpose: table.purpose || '',
        imageUrl: table.imageUrl || '',
        images: table.images || []
      });
      setImagesList(table.images || []);
    } else {
      setEditingTable(null);
      setFormData({
        number: '',
        seats: '',
        isActive: true,
        name: '',
        description: '',
        purpose: '',
        imageUrl: '',
        images: []
      });
      setImagesList([]);
    }
    setImageInput('');
    setIsModalOpen(true);
  };

  const addImage = () => {
    if (imageInput.trim() && !imagesList.includes(imageInput.trim())) {
      setImagesList([...imagesList, imageInput.trim()]);
      setImageInput('');
    }
  };

  const removeImage = (index: number) => {
    setImagesList(imagesList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const url = '/api/admin/tables';
    const method = editingTable ? 'PUT' : 'POST';
    
    // Собираем body без лишних полей
    const body: any = {
      number: parseInt(formData.number),
      seats: parseInt(formData.seats),
      isActive: formData.isActive,
      name: formData.name || null,
      description: formData.description || null,
      purpose: formData.purpose || null,
      imageUrl: formData.imageUrl || null,
      images: imagesList
    };
    
    // Если редактируем - добавляем id
    if (editingTable) {
      body.id = editingTable.id;
    }
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        toast.success(editingTable ? 'Кабинка обновлена' : 'Кабинка добавлена');
        setIsModalOpen(false);
        setEditingTable(null);
        setFormData({ 
          number: '', 
          seats: '', 
          isActive: true,
          name: '',
          description: '',
          purpose: '',
          imageUrl: '',
          images: []
        });
        setImagesList([]);
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
          isActive: !table.isActive,
          name: table.name,
          description: table.description,
          purpose: table.purpose,
          imageUrl: table.imageUrl,
          images: table.images
        })
      });
      
      if (res.ok) {
        toast.success(table.isActive ? 'Кабинка скрыта' : 'Кабинка активирована');
        fetchTables();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const deleteTable = async (id: number, number: number) => {
    if (!confirm(`Удалить кабинку №${number}?`)) return;
    
    try {
      const res = await fetch(`/api/admin/tables?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Кабинка удалена');
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
          Управление кабинками
        </h1>
        <p className={styles.subtitle}>Всего кабинок: {tables.length}</p>
        <button onClick={() => openModal()} className={styles.addBtn}>
          <Plus size={18} />
          Добавить кабинку
        </button>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{tables.length}</div>
          <div className={styles.statLabel}>Всего кабинок</div>
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
            <div className={styles.tableImage}>
              {table.imageUrl ? (
                <ImageWithFallback
                  src={table.imageUrl}
                  alt={`Кабинка ${table.number}`}
                  fallback="default"
                />
              ) : (
                <div className={styles.noImage}>
                  <Image size={32} />
                  <span>Нет фото</span>
                </div>
              )}
            </div>
            <div className={styles.tableHeader}>
              <span className={styles.tableNumber}>Кабинка №{table.number}</span>
              <span className={styles.tableSeats}>
                <Users size={14} />
                {table.seats} места
              </span>
            </div>
            {table.name && <div className={styles.tableName}>{table.name}</div>}
            {table.purpose && <div className={styles.tablePurpose}>🎯 {table.purpose}</div>}
            <div className={styles.tableStatus}>
              <span className={`${styles.statusBadge} ${table.isActive ? styles.active : styles.inactive}`}>
                {table.isActive ? '🟢 Активна' : '🔴 Неактивна'}
              </span>
            </div>
            <div className={styles.tableActions}>
              <button onClick={() => toggleActive(table)} className={styles.toggleBtn} title={table.isActive ? 'Скрыть' : 'Показать'}>
                {table.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button 
                onClick={() => openModal(table)} 
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
          <p>Нет добавленных кабинок</p>
          <button onClick={() => openModal()} className={styles.emptyBtn}>
            Добавить первую кабинку
          </button>
        </div>
      )}

      {/* Модальное окно */}
      {isModalOpen && (
        <div className={styles.modal} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2>{editingTable ? 'Редактировать кабинку' : 'Добавить кабинку'}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label>Номер кабинки *</label>
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
                  <label>Количество мест *</label>
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
                  <label>Название кабинки</label>
                  <input
                    type="text"
                    placeholder="Например: Уютная, Семейная"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                
                <div className={styles.field}>
                  <label>Назначение</label>
                  <input
                    type="text"
                    placeholder="День рождения, Романтический ужин"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label>Описание</label>
                <textarea
                  placeholder="Описание кабинки"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className={styles.field}>
                <label>Главное фото (URL)</label>
                <input
                  type="text"
                  placeholder="https://example.com/photo.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label>Галерея фото</label>
                <div className={styles.imageInputGroup}>
                  <input
                    type="text"
                    placeholder="Добавьте URL фото"
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                  />
                  <button type="button" onClick={addImage} className={styles.addImageBtn}>
                    <Plus size={18} />
                  </button>
                </div>
                {imagesList.length > 0 && (
                  <div className={styles.imagesPreview}>
                    {imagesList.map((img, index) => (
                      <div key={index} className={styles.imagePreviewItem}>
                        <img src={img} alt={`Фото ${index + 1}`} />
                        <button type="button" onClick={() => removeImage(index)} className={styles.removeImageBtn}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Кабинка активна (доступна для бронирования)
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