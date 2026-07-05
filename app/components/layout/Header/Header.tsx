'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, User, LogOut, Heart, Package, Calendar } from 'lucide-react';
import Logo from '../../ui/Logo/Logo';
import CartIcon from '@/app/components/cart/CartIcon/CartIcon';
import MobileMenu from '@/app/components/layout/MobileMenu/MobileMenu';
import { useAuth } from '@/app/contexts/AuthContext';
import styles from './Header.module.scss';
import WorkingHours from '../../ui/WorkingHours/WorkingHours';

// Базовые ссылки для всех
const baseNavLinks = [
  { href: '/', label: 'Главная' },
  { href: '/menu', label: 'Меню' },
  { href: '/booking', label: 'Бронь стола' },
  { href: '/blog', label: 'Блог' },
  { href: '/reviews', label: 'Отзывы' },
  { href: '/contacts', label: 'Контакты' },
];

// Ссылки для менеджера (уникальные)
const managerLinks = [
  { href: '/manager/orders', label: 'Заказы' },
  { href: '/manager/bookings', label: 'Бронирования' },
  { href: '/manager/charity', label: 'Заявки на помощь' },
];

// Ссылки для админа (уникальные)
const adminLinks = [
  { href: '/admin', label: '👑 Дашборд' }
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getNavLinks = () => {
    const links = [...baseNavLinks];
    const existingHrefs = new Set(links.map(l => l.href));
    
    if (user?.role === 'MANAGER') {
      for (const link of managerLinks) {
        if (!existingHrefs.has(link.href)) {
          links.push(link);
          existingHrefs.add(link.href);
        }
      }
    }
    
    if (user?.role === 'ADMIN') {
      for (const link of [...managerLinks, ...adminLinks]) {
        if (!existingHrefs.has(link.href)) {
          links.push(link);
          existingHrefs.add(link.href);
        }
      }
    }
    
    return links;
  };

  const navLinks = getNavLinks();

  const userMenuLinks = [
    { href: '/profile', label: '👤 Профиль', icon: null },
    { href: '/profile/favorites', label: '❤️ Избранное', icon: Heart },
    { href: '/profile/saved-carts', label: '📦 Мои сеты', icon: Package },
    { href: '/profile/bookings', label: '📅 Мои брони', icon: Calendar },
  ];

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <div className={styles.left}>
          <MobileMenu navLinks={navLinks} />
          <Logo />
        </div>

        <nav className={styles.nav}>
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className={styles.navLink}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={styles.right}>
          {/* WorkingHours скрываем на мобильных */}
          <div className={styles.desktopOnly}>
            <WorkingHours />
          </div>
          
          {/* Телефон скрываем на мобильных */}
          <a href="tel:+79882938907" className={`${styles.phone} ${styles.desktopOnly}`}>
            <Phone size={18} />
            <span>+7 (988) 293-89-07</span>
          </a>
          
          <CartIcon />
          
          {user ? (
            <div className={styles.userMenu}>
              {/* Избранное скрываем на мобильных */}
              {/* <Link href="/profile/favorites" className={`${styles.favoriteLink} ${styles.desktopOnly}`} title="Избранное">
                <Heart size={20} />
              </Link> */}
              
              <div className={styles.userDropdown}>
                <button className={styles.userBtn}>
                  <User size={20} />
                  <span className={styles.userName}>{user.name || user.email?.split('@')[0]}</span>
                  <span className={styles.dropdownArrow}>▼</span>
                </button>
                <div className={styles.dropdownMenu}>
                  {userMenuLinks.map(link => (
                    <Link key={link.href} href={link.href} className={styles.dropdownItem}>
                      {link.label}
                    </Link>
                  ))}
                  <button onClick={logout} className={styles.dropdownItem}>
                    <LogOut size={16} />
                    Выйти
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link href="/login" className={styles.user}>
              <User size={20} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}