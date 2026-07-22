'use client';

import { useState, useEffect } from 'react';
import { Menu, X, User, Heart, Package, LogOut, Phone, MapPin, Clock, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import styles from './MobileMenu.module.scss';

interface MobileMenuProps {
  navLinks: { href: string; label: string }[];
}

export default function MobileMenu({ navLinks }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const getUserLinks = () => {
    const links = [];
    if (user) {
      links.push({ href: '/profile', label: 'Профиль', icon: <User size={18} /> });
      links.push({ href: '/profile/favorites', label: 'Избранное', icon: <Heart size={18} /> });
      links.push({ href: '/profile/saved-carts', label: 'Мои сеты', icon: <Package size={18} /> });
      links.push({ href: '/profile/bookings', label: 'Мои брони', icon: <Calendar size={18} /> });
      if (user.role === 'MANAGER' || user.role === 'ADMIN') {
        links.push({ href: '/manager/orders', label: 'Управление заказами', icon: null });
        links.push({ href: '/manager/bookings', label: 'Управление бронями', icon: null });
      }
      if (user.role === 'ADMIN') {
        links.push({ href: '/admin', label: 'Админ-панель', icon: null });
        links.push({ href: '/admin/orders', label: 'Все заказы', icon: null });
        links.push({ href: '/admin/dishes', label: 'Управление меню', icon: null });
        links.push({ href: '/admin/users', label: 'Пользователи', icon: null });
        links.push({ href: '/admin/tables', label: 'Столики', icon: null });
      }
    } else {
      links.push({ href: '/login', label: 'Войти', icon: null });
      links.push({ href: '/register', label: 'Регистрация', icon: null });
    }
    return links;
  };

  const userLinks = getUserLinks();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className={styles.burger}
        aria-label="Открыть меню"
      >
        <Menu size={24} />
      </button>

      {isOpen && (
        <>
          <div className={styles.overlay} onClick={() => setIsOpen(false)} />
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <div className={styles.logo}>
                <div className={styles.logoText}>Челентано</div>
                <div className={styles.logoSub}>Ресторан & Доставка</div>
              </div>
              <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
                <X size={22} />
              </button>
            </div>
            
            <div className={styles.drawerContent}>
              <div className={styles.navSection}>
                <div className={styles.sectionTitle}>Меню</div>
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={styles.drawerLink}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className={styles.navSection}>
                <div className={styles.sectionTitle}>Аккаунт</div>
                {userLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={styles.drawerLink}
                  >
                    {link.icon && <span className={styles.linkIcon}>{link.icon}</span>}
                    {link.label}
                  </Link>
                ))}
                {user && (
                  <button onClick={handleLogout} className={styles.logoutBtn}>
                    <LogOut size={18} />
                    Выйти
                  </button>
                )}
              </div>
            </div>

            <div className={styles.drawerFooter}>
              <a href="tel:+79882913293" className={styles.phoneLink}>
                <Phone size={16} />
                +7 (988) 291-32-93
              </a>
              <a href="tel:+79882938907" className={styles.phoneLink}>
                <Phone size={16} />
                +7 (988) 293-89-07
              </a>
              <div className={styles.address}>
                <MapPin size={14} />
                Махачкала, ул. Агасиева, 5А
              </div>
              <div className={styles.hours}>
                <Clock size={14} />
                11:00 - 23:00 (пт-вс до 01:00)
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}