'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Save, Clock, Phone, Mail, MapPin, Plus, Trash2, Calendar, Share2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.scss';

interface Settings {
  workDays: {
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };
  specialDays: Array<{ date: string; message: string; hours?: string; isOpen?: boolean }>;
  isSpecialDay: boolean;
  specialMessage: string;
  phone: string;
  email: string;
  address: string;
  instagram: string;
  telegram: string;
  whatsapp: string;
  deliveryMinSum: number;
  deliveryPrice: number;
}

const dayNames: Record<string, string> = {
  monday: 'Понедельник',
  tuesday: 'Вторник',
  wednesday: 'Среда',
  thursday: 'Четверг',
  friday: 'Пятница',
  saturday: 'Суббота',
  sunday: 'Воскресенье'
};

export default function AdminSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'hours' | 'special'>('hours');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data.settings);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Ошибка загрузки настроек');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (res.ok) {
        toast.success('Настройки сохранены');
      } else {
        toast.error('Ошибка сохранения');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setIsSaving(false);
    }
  };

  const updateWorkDay = (day: string, field: 'open' | 'close', value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      workDays: {
        ...settings.workDays,
        [day]: {
          ...settings.workDays[day as keyof typeof settings.workDays],
          [field]: value
        }
      }
    });
  };

  const addSpecialDay = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      specialDays: [...settings.specialDays, { date: '', message: '', hours: '', isOpen: true }]
    });
  };

  const updateSpecialDay = (index: number, field: string, value: any) => {
    if (!settings) return;
    const newSpecialDays = [...settings.specialDays];
    newSpecialDays[index] = { ...newSpecialDays[index], [field]: value };
    setSettings({ ...settings, specialDays: newSpecialDays });
  };

  const removeSpecialDay = (index: number) => {
    if (!settings) return;
    const newSpecialDays = settings.specialDays.filter((_, i) => i !== index);
    setSettings({ ...settings, specialDays: newSpecialDays });
  };

  if (loading || isLoading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  if (!settings) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Настройки ресторана</h1>
        <button onClick={saveSettings} disabled={isSaving} className={styles.saveBtn}>
          <Save size={18} />
          {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </div>

      <div className={styles.tabs}>
        <button onClick={() => setActiveTab('hours')} className={`${styles.tab} ${activeTab === 'hours' ? styles.active : ''}`}>
          <Clock size={18} />
          Режим работы
        </button>
        <button onClick={() => setActiveTab('special')} className={`${styles.tab} ${activeTab === 'special' ? styles.active : ''}`}>
          <Calendar size={18} />
          Особые дни
        </button>
      </div>

      {activeTab === 'hours' && (
        <div className={styles.card}>
          <h2>Режим работы по дням</h2>
          {Object.entries(settings.workDays).map(([day, hours]) => (
            <div key={day} className={styles.timeRow}>
              <div className={styles.dayName}>{dayNames[day]}</div>
              <div className={styles.timeInputs}>
                <input
                  type="time"
                  value={hours.open}
                  onChange={(e) => updateWorkDay(day, 'open', e.target.value)}
                  className={styles.timeInput}
                />
                <span>—</span>
                <input
                  type="time"
                  value={hours.close}
                  onChange={(e) => updateWorkDay(day, 'close', e.target.value)}
                  className={styles.timeInput}
                />
              </div>
            </div>
          ))}
          
          <div className={styles.deliveryRow}>
            <label>Минимальная сумма для бесплатной доставки</label>
            <input
              type="number"
              value={settings.deliveryMinSum}
              onChange={(e) => setSettings({ ...settings, deliveryMinSum: parseInt(e.target.value) })}
              className={styles.numberInput}
            />
            <span>₽</span>
          </div>
          
          <div className={styles.deliveryRow}>
            <label>Стоимость доставки (при меньшей сумме)</label>
            <input
              type="number"
              value={settings.deliveryPrice}
              onChange={(e) => setSettings({ ...settings, deliveryPrice: parseInt(e.target.value) })}
              className={styles.numberInput}
            />
            <span>₽</span>
          </div>
        </div>
      )}

      {activeTab === 'special' && (
        <div className={styles.card}>
          <div className={styles.specialToggle}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={settings.isSpecialDay}
                onChange={(e) => setSettings({ ...settings, isSpecialDay: e.target.checked })}
              />
              Сегодня особый день
            </label>
            {settings.isSpecialDay && (
              <input
                type="text"
                value={settings.specialMessage || ''}
                onChange={(e) => setSettings({ ...settings, specialMessage: e.target.value })}
                placeholder="Сообщение о режиме работы (например: Сегодня работаем до 20:00)"
                className={styles.specialInput}
              />
            )}
          </div>
          
          <div className={styles.specialDaysList}>
            <div className={styles.sectionHeader}>
              <h3>Запланированные особые дни</h3>
              <button onClick={addSpecialDay} className={styles.addBtn}>
                <Plus size={16} />
                Добавить
              </button>
            </div>
            
            {settings.specialDays.map((day, index) => (
              <div key={index} className={styles.specialDayRow}>
                <input
                  type="date"
                  value={day.date}
                  onChange={(e) => updateSpecialDay(index, 'date', e.target.value)}
                  className={styles.dateInput}
                />
                <input
                  type="text"
                  value={day.message}
                  onChange={(e) => updateSpecialDay(index, 'message', e.target.value)}
                  placeholder="Причина (Новый год, и т.д.)"
                  className={styles.messageInput}
                />
                <input
                  type="text"
                  value={day.hours || ''}
                  onChange={(e) => updateSpecialDay(index, 'hours', e.target.value)}
                  placeholder="Часы работы (необязательно)"
                  className={styles.hoursInput}
                />
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={day.isOpen !== false}
                    onChange={(e) => updateSpecialDay(index, 'isOpen', e.target.checked)}
                  />
                  Открыто
                </label>
                <button onClick={() => removeSpecialDay(index)} className={styles.removeBtn}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            
            {settings.specialDays.length === 0 && (
              <div className={styles.emptySpecial}>
                <p>Нет запланированных особых дней</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}