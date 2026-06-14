'use client';

import { useState } from 'react';
import styles from './ImageWithFallback.module.scss';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: 'dish' | 'blog' | 'default';
}

// Используем прямые пути к файлам в public
const fallbackImages = {
  dish: '/images/dish-placeholder.svg',
  blog: '/images/blog-placeholder.svg',
  default: '/images/placeholder.svg'
};

export default function ImageWithFallback({ 
  src, 
  alt, 
  className = '', 
  fallback = 'default'
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  const fallbackSrc = fallbackImages[fallback];

  if (error || !src) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}