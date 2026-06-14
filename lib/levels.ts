export interface Level {
    id: string;
    name: string;
    title: string;
    icon: string;
    color: string;
    bgColor: string;
    minSpent: number;
    minOrders: number;
    xpRequired: number;
    perks: string[];
  }
  
  export const LEVELS: Level[] = [
    {
      id: 'NOVICE',
      name: 'Новичок',
      title: '🍽️ Первые шаги',
      icon: '🌱',
      color: '#9e9e9e',
      bgColor: '#f5f5f5',
      minSpent: 0,
      minOrders: 0,
      xpRequired: 0,
      perks: ['Доступ к меню', 'Просмотр отзывов']
    },
    {
      id: 'BEGINNER',
      name: 'Начинающий',
      title: '🍜 Первые впечатления',
      icon: '🍜',
      color: '#8bc34a',
      bgColor: '#f1f8e9',
      minSpent: 1500,
      minOrders: 1,
      xpRequired: 300,
      perks: ['Участие в розыгрышах', 'Уведомления об акциях']
    },
    {
      id: 'EXPLORER',
      name: 'Искатель',
      title: '🔍 Исследователь вкусов',
      icon: '🔍',
      color: '#00bcd4',
      bgColor: '#e0f7fa',
      minSpent: 3500,
      minOrders: 3,
      xpRequired: 700,
      perks: ['Ранний доступ к новинкам', 'Приоритетная поддержка']
    },
    {
      id: 'GOURMET',
      name: 'Гурман',
      title: '🍷 Ценитель вкуса',
      icon: '🍷',
      color: '#4caf50',
      bgColor: '#e8f5e9',
      minSpent: 7500,
      minOrders: 7,
      xpRequired: 1500,
      perks: ['Приоритетное бронирование', 'Персональные рекомендации']
    },
    {
      id: 'CONNOISSEUR',
      name: 'Знаток',
      title: '🎓 Эксперт кухни',
      icon: '🎓',
      color: '#3f51b5',
      bgColor: '#e8eaf6',
      minSpent: 15000,
      minOrders: 15,
      xpRequired: 3000,
      perks: ['Бесплатная доставка от 500₽', 'Дегустация новинок']
    },
    {
      id: 'EXPERT',
      name: 'Эксперт',
      title: '👨‍🍳 Мастер вкуса',
      icon: '👨‍🍳',
      color: '#2196f3',
      bgColor: '#e3f2fd',
      minSpent: 30000,
      minOrders: 25,
      xpRequired: 6000,
      perks: ['Подарок на ДР', 'Скидка для друзей 5%']
    },
    {
      id: 'MASTER',
      name: 'Мастер',
      title: '🏆 Профи',
      icon: '🏆',
      color: '#ff9800',
      bgColor: '#fff3e0',
      minSpent: 60000,
      minOrders: 40,
      xpRequired: 12000,
      perks: ['Индивидуальные сеты', 'Приоритетная поддержка 24/7']
    },
    {
      id: 'LEGEND',
      name: 'Легенда',
      title: '🌟 Икона стиля',
      icon: '🌟',
      color: '#ff5722',
      bgColor: '#fbe9e7',
      minSpent: 100000,
      minOrders: 60,
      xpRequired: 20000,
      perks: ['Именной сертификат', 'Бесплатный десерт к заказу']
    },
    {
      id: 'ICON',
      name: 'Икона',
      title: '💎 Легендарный статус',
      icon: '💎',
      color: '#9c27b0',
      bgColor: '#f3e5f5',
      minSpent: 150000,
      minOrders: 85,
      xpRequired: 30000,
      perks: ['Закрытые мероприятия', 'Секретное меню']
    },
    {
      id: 'AMBASSADOR',
      name: 'Амбассадор',
      title: '⭐ Посол ресторана',
      icon: '⭐',
      color: '#e91e63',
      bgColor: '#fce4ec',
      minSpent: 220000,
      minOrders: 120,
      xpRequired: 45000,
      perks: ['Пожизненный статус', 'Приглашение на кулинарные мастер-классы']
    },
    {
      id: 'GRAND_MASTER',
      name: 'Грандмастер',
      title: '👑 Король гурманов',
      icon: '👑',
      color: '#ffd700',
      bgColor: '#fff8e1',
      minSpent: 350000,
      minOrders: 180,
      xpRequired: 70000,
      perks: ['Персональный шеф-повар', 'Индивидуальное меню']
    },
    {
      id: 'VISIONARY',
      name: 'Визионер',
      title: '💎 Легенда ресторана',
      icon: '🏅',
      color: '#c4492c',
      bgColor: '#fef3e8',
      minSpent: 500000,
      minOrders: 250,
      xpRequired: 100000,
      perks: ['Бесплатный банкет на 10 персон', 'Именное блюдо в меню', 'Вечный статус']
    }
  ];
  
  export function getLevelBySpent(spent: number, orders: number): Level {
    let currentLevel = LEVELS[0];
    for (const level of LEVELS) {
      if (spent >= level.minSpent && orders >= level.minOrders) {
        currentLevel = level;
      } else {
        break;
      }
    }
    return currentLevel;
  }
  
  export function getNextLevel(currentLevel: Level): Level | null {
    const currentIndex = LEVELS.findIndex(l => l.id === currentLevel.id);
    return LEVELS[currentIndex + 1] || null;
  }
  
  export function getProgressToNextLevel(spent: number, orders: number, currentLevel: Level): number {
    const nextLevel = getNextLevel(currentLevel);
    if (!nextLevel) return 100;
    
    const spentProgress = Math.min(1, Math.max(0, (spent - currentLevel.minSpent) / (nextLevel.minSpent - currentLevel.minSpent)));
    const ordersProgress = Math.min(1, Math.max(0, (orders - currentLevel.minOrders) / (nextLevel.minOrders - currentLevel.minOrders)));
    
    return Math.round((spentProgress + ordersProgress) / 2 * 100);
  }