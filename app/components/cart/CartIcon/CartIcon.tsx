'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/app/contexts/CartContext';
import Particles from '../../ui/Particles/Particles';
import Link from 'next/link';
import styles from './CartIcon.module.scss';

export default function CartIcon() {
  const { getCount, items } = useCart();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [particlePosition, setParticlePosition] = useState({ x: 0, y: 0 });
  const [count, setCount] = useState(0);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newCount = getCount();
    if (newCount > count && iconRef.current) {
      setIsAnimating(true);
      
      // Получаем позицию иконки для частиц
      const rect = iconRef.current.getBoundingClientRect();
      setParticlePosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      setShowParticles(true);
      
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
      
      setTimeout(() => {
        setShowParticles(false);
      }, 1000);
    }
    setCount(newCount);
  }, [items]);

  return (
    <>
      {showParticles && (
        <Particles 
          x={particlePosition.x} 
          y={particlePosition.y} 
          onComplete={() => setShowParticles(false)}
        />
      )}
      
      <Link href="/cart" className={styles.cartIcon}>
        <div 
          ref={iconRef}
          className={`${styles.iconWrapper} ${isAnimating ? styles.animate : ''}`}
        >
          <ShoppingBag size={22} />
        </div>
        {count > 0 && (
          <span className={`${styles.badge} ${isAnimating ? styles.badgeAnimate : ''}`}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>
    </>
  );
}