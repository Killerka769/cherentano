'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Utensils, ArrowLeft } from 'lucide-react';
import ImageWithFallback from '@/app/components/ui/ImageWithFallback/ImageWithFallback';
import styles from './page.module.scss';

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
    } | null;
  };
}

interface WeeklyMenuClientProps {
  initialWeeklyMenu: Record<string, WeeklyMenuDish[]>;
  initialDate: string;
}

const DAYS = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

export default function WeeklyMenuClient({ initialWeeklyMenu, initialDate }: WeeklyMenuClientProps) {
  // ✅ Сразу вычисляем начальный день при инициализации
  const getInitialDay = (menu: Record<string, WeeklyMenuDish[]>) => {
    const daysList = Object.keys(menu);
    if (daysList.length === 0) return '';
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Если сегодня есть в списке — выбираем сегодня
    if (daysList.includes(todayStr)) {
      return todayStr;
    }
    // Иначе выбираем первый день
    return daysList[0];
  };

  const [weeklyMenu, setWeeklyMenu] = useState<Record<string, WeeklyMenuDish[]>>(initialWeeklyMenu);
  const [days, setDays] = useState<string[]>(Object.keys(initialWeeklyMenu));
  const [selectedDay, setSelectedDay] = useState<string>(getInitialDay(initialWeeklyMenu)); // ✅ Сразу с значением!
  const [isLoading, setIsLoading] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  // ✅ Если selectedDay не установлен, но days появились — устанавливаем
  useEffect(() => {
    if (days.length > 0 && !selectedDay) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      if (days.includes(todayStr) && weekOffset === 0) {
        setSelectedDay(todayStr);
      } else {
        setSelectedDay(days[0]);
      }
    }
  }, [days, weekOffset]);

  const fetchWeeklyMenu = async (offset: number) => {
    setIsLoading(true);
    try {
      const today = new Date();
      today.setDate(today.getDate() + offset * 7);
      const startDate = today.toISOString().split('T')[0];
      
      const res = await fetch(`/api/weekly-menu?startDate=${startDate}`);
      const data = await res.json();
      
      const menuData = data.menu || {};
      setWeeklyMenu(menuData);
      
      const daysList = Object.keys(menuData);
      setDays(daysList);
      
      if (daysList.length > 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        if (daysList.includes(todayStr) && offset === 0) {
          setSelectedDay(todayStr);
        } else {
          setSelectedDay(daysList[0]);
        }
      } else {
        setSelectedDay('');
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

  const getFullDayName = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const weekDays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return `${weekDays[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${year}`;
  };

  const isToday = (dateStr: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return dateStr === todayStr;
  };

  const handlePrevWeek = () => {
    const newOffset = weekOffset - 1;
    setWeekOffset(newOffset);
    fetchWeeklyMenu(newOffset);
  };

  const handleNextWeek = () => {
    const newOffset = weekOffset + 1;
    setWeekOffset(newOffset);
    fetchWeeklyMenu(newOffset);
  };

  const handleToday = () => {
    setWeekOffset(0);
    fetchWeeklyMenu(0);
  };

  const getWeekRange = () => {
    const today = new Date();
    today.setDate(today.getDate() + weekOffset * 7);
    const start = new Date(today);
    const end = new Date(today);
    end.setDate(end.getDate() + 6);
    
    const startStr = `${start.getDate()} ${MONTHS[start.getMonth()]}`;
    const endStr = `${end.getDate()} ${MONTHS[end.getMonth()]}`;
    const year = start.getFullYear();
    
    return `${startStr} — ${endStr} ${year}`;
  };

  const currentDishes = selectedDay ? weeklyMenu[selectedDay] || [] : [];

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/menu" className={styles.backLink}>
          <ArrowLeft size={18} />
          Назад в меню
        </Link>
        <h1 className={styles.title}>📅 Меню на неделю</h1>
        <div className={styles.weekRange}>{getWeekRange()}</div>
      </div>

      {/* Навигация по неделям */}
      <div className={styles.navigation}>
        <button onClick={handlePrevWeek} className={styles.navBtn}>
          <ChevronLeft size={20} />
        </button>
        <button onClick={handleToday} className={styles.todayBtn}>Сегодня</button>
        <button onClick={handleNextWeek} className={styles.navBtn}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Дни недели */}
      {days.length === 0 ? (
        <div className={styles.empty}>
          {/* <p>На эту неделю нет блюд</p>
          <p className={styles.emptyHint}>Загляните позже, меню обновляется</p> */}
          <button onClick={handleToday} className={styles.todayBtn}>Перейти к сегодняшней неделе</button>
        </div>
      ) : (
        <>
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
                    {count > 0 ? `${count} блюд` : '—'}
                  </span>
                  {today && <span className={styles.todayBadge}>Сегодня</span>}
                </button>
              );
            })}
          </div>

          {/* Блюда на выбранный день */}
          {selectedDay && (
            <div className={styles.dishesSection}>
              <div className={styles.dayHeader}>
                <div className={styles.dayHeaderLeft}>
                  <Utensils size={20} className={styles.mealIcon} />
                  <h2 className={styles.dayTitle}>{getFullDayName(selectedDay)}</h2>
                </div>
                <div className={styles.dayHeaderRight}>
                  <span className={styles.dishTotal}>
                    {currentDishes.length} {currentDishes.length === 1 ? 'блюдо' : currentDishes.length < 5 ? 'блюда' : 'блюд'}
                  </span>
                </div>
              </div>

              {currentDishes.length === 0 ? (
                <div className={styles.emptyDishes}>
                  <p>На этот день пока нет блюд</p>
                  <p className={styles.emptyHint}>Загляните в другие дни</p>
                </div>
              ) : (
                <div className={styles.dishesGrid}>
                  {currentDishes.map((item) => (
                    <div key={item.id} className={styles.dishCard}>
                      <div className={styles.dishImage}>
                        <ImageWithFallback
                          src={item.dish.imageUrl || ''}
                          alt={item.dish.name}
                          fallback="dish"
                        />
                        {item.dish.weight && (
                          <span className={styles.dishWeightBadge}>{item.dish.weight}г</span>
                        )}
                      </div>
                      <div className={styles.dishInfo}>
                        <div className={styles.dishName}>{item.dish.name}</div>
                        <div className={styles.dishMeta}>
                          <span className={styles.dishCategory}>{item.dish.category?.name}</span>
                        </div>
                        <div className={styles.dishPrice}>{item.dish.price} ₽</div>
                      </div>
                      <Link 
                        href={`/menu/${item.dish.slug}`} 
                        className={styles.dishLink}
                      >
                        Подробнее →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}