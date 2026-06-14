'use client';

import { Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '@/app/contexts/CartContext';
import styles from './CartItem.module.scss';

interface CartItemProps {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export default function CartItem({ id, name, price, quantity, imageUrl }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className={styles.item}>
      <div className={styles.image}>
        <img 
          src={imageUrl || `/images/dishes/${id}.jpg`} 
          alt={name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
          }}
        />
      </div>
      
      <div className={styles.info}>
        <h3 className={styles.name}>{name}</h3>
        <div className={styles.price}>{price} ₽</div>
      </div>
      
      <div className={styles.controls}>
        <div className={styles.quantity}>
          <button onClick={() => updateQuantity(id, quantity - 1)} className={styles.qtyBtn}>
            <Minus size={16} />
          </button>
          <span className={styles.qtyValue}>{quantity}</span>
          <button onClick={() => updateQuantity(id, quantity + 1)} className={styles.qtyBtn}>
            <Plus size={16} />
          </button>
        </div>
        
        <div className={styles.total}>{price * quantity} ₽</div>
        
        <button onClick={() => removeFromCart(id)} className={styles.deleteBtn}>
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}