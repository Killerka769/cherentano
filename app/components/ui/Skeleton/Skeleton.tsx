'use client';

import styles from './Skeleton.module.scss';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: number | string;
  height?: number | string;
  className?: string;
}

export default function Skeleton({ variant = 'text', width, height, className = '' }: SkeletonProps) {
  const style = {
    width: width || (variant === 'circular' ? 40 : '100%'),
    height: height || (variant === 'text' ? 16 : variant === 'circular' ? 40 : 200),
  };
  
  return (
    <div className={`${styles.skeleton} ${styles[variant]} ${className}`} style={style}>
      <div className={styles.shimmer}></div>
    </div>
  );
}

export function DishCardSkeleton() {
  return (
    <div className={styles.dishCardSkeleton}>
      <Skeleton variant="rectangular" height={220} />
      <div className={styles.content}>
        <Skeleton width="80%" height={20} />
        <Skeleton width="60%" height={16} />
        <div className={styles.footer}>
          <Skeleton width={80} height={28} />
          <Skeleton variant="circular" width={40} height={40} />
        </div>
      </div>
    </div>
  );
}

export function MenuGridSkeleton() {
  return (
    <div className={styles.grid}>
      {[...Array(6)].map((_, i) => (
        <DishCardSkeleton key={i} />
      ))}
    </div>
  );
}