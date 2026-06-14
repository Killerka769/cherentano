'use client';

import { useState, useEffect } from 'react';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Загрузка из localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Сохранение в localStorage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const addToCart = (dish: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === dish.id);
      if (existing) {
        return prev.map(item =>
          item.id === dish.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...dish, quantity }];
    });
  };

  const removeFromCart = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal,
    getCount,
    isInitialized,
  };
}