'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ChevronLeft, ChevronRight, Utensils } from 'lucide-react';
import ImageWithFallback from '@/app/components/ui/ImageWithFallback/ImageWithFallback';
import styles from './WeeklyMenu.module.scss';

interface WeeklyMenuDish {
  id: number;
  date: string;
  dishId: number;
  dish: {
    id: number;
    name: string;
    slug: string;
    price: number;
    imageUrl: string | null;
    weight: number | null;
    description: string | null;
    category: {
      name: string;
    };
  };
}

interface WeeklyMenuProps {
  onSelectDish?: (dish: any) => void;
}

const DAYS = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

export default function WeeklyMenu({ onSelectDish }: WeeklyMenuProps) {
  const [weeklyMenu, setWeeklyMenu] = useState<Record<string, WeeklyMenuDish[]>>({});
  const [days, setDays] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    fetchWeeklyMenu();
  }, [weekOffset]);

  const fetchWeeklyMenu = async () => {
    setIsLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + weekOffset * 7);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      const res = await fetch(`/api/weekly-menu?startDate=${startDateStr}`);
      const data = await res.json();
      
      setWeeklyMenu(data.menu || {});
      const daysList = Object.keys(data.menu || {});
      setDays(daysList);
      
      if (daysList.length > 0) {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        if (daysList.includes(todayStr) && weekOffset === 0) {
          setSelectedDay(todayStr);
        } else {
          setSelectedDay(daysList[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch weekly menu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDayName = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
  };

  const isToday = (dateStr: string) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return dateStr === todayStr;
  };

  const handlePrevWeek = () => setWeekOffset(prev => prev - 1);
  const handleNextWeek = () => setWeekOffset(prev => prev + 1);
  const handleToday = () => {
    setWeekOffset(0);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setSelectedDay(todayStr);
  };

  if (isLoading) {
    return (
      <div className={styles.skeleton}>
        <div className={styles.skeletonHeader}></div>
        <div className={styles.skeletonDays}>
          {[...Array(7)].map((_, i) => (
            <div key={i} className={styles.skeletonDay}></div>
          ))}
        </div>
        <div className={styles.skeletonDishes}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className={styles.skeletonDish}></div>
          ))}
        </div>
      </div>
    );
  }

  const currentDishes = selectedDay ? weeklyMenu[selectedDay] || [] : [];

  return (
    <div className={styles.weeklyMenu}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Calendar size={20} />
          Меню на неделю
        </h2>
        <div className={styles.navigation}>
          <button onClick={handlePrevWeek} className={styles.navBtn}>
            <ChevronLeft size={18} />
          </button>
          <button onClick={handleToday} className={styles.todayBtn}>Сегодня</button>
          <button onClick={handleNextWeek} className={styles.navBtn}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className={styles.daysNav}>
        {days.map(day => {
          const count = weeklyMenu[day]?.length || 0;
          const today = isToday(day);
          
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`${styles.dayBtn} ${selectedDay === day ? styles.active : ''} ${today ? styles.today : ''}`}
            >
              <span className={styles.dayDate}>{getDayName(day)}</span>
              <span className={styles.dishCount}>
                {count > 0 ? `${count} блюд` : 'пусто'}
              </span>
              {today && <span className={styles.todayBadge}>Сегодня</span>}
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className={styles.dishesList}>
          <div className={styles.dayHeader}>
            <Utensils size={18} className={styles.mealIcon} />
            <h3 className={styles.dayTitle}>{getDayName(selectedDay)}</h3>
          </div>
          
          {currentDishes.length === 0 ? (
            <div className={styles.emptyDishes}>
              <p>На этот день пока нет блюд</p>
            </div>
          ) : (
            <div className={styles.dishesGrid}>
              {currentDishes.map((item) => (
                <div 
                  key={item.id} 
                  className={styles.dishCard}
                  onClick={() => onSelectDish?.(item.dish)}
                >
                  <div className={styles.dishImage}>
                    <ImageWithFallback
                      src={item.dish.imageUrl || ''}
                      alt={item.dish.name}
                      fallback="dish"
                    />
                  </div>
                  <div className={styles.dishInfo}>
                    <div className={styles.dishName}>{item.dish.name}</div>
                    <div className={styles.dishMeta}>
                      <span className={styles.dishCategory}>{item.dish.category?.name}</span>
                      {item.dish.weight && (
                        <span className={styles.dishWeight}>{item.dish.weight}г</span>
                      )}
                    </div>
                    <div className={styles.dishPrice}>{item.dish.price} ₽</div>
                  </div>
                  <Link 
                    href={`/menu/${item.dish.slug}`} 
                    className={styles.dishLink}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Подробнее
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}