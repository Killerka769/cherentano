'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Check } from 'lucide-react';
import styles from './AddressSelector.module.scss';

interface Address {
  id: string;
  address: string;
  usedAt: string;
}

interface AddressSelectorProps {
  value: string;
  onChange: (address: string) => void;
  onAddressSaved?: () => void;
}

export default function AddressSelector({ value, onChange, onAddressSaved }: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [manualAddress, setManualAddress] = useState('');

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/user/addresses');
      const data = await res.json();
      setAddresses(data.addresses || []);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectAddress = (address: string) => {
    onChange(address);
    setManualAddress('');
  };

  const saveAddress = async () => {
    if (!manualAddress.trim()) return;
    
    try {
      const res = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: manualAddress })
      });
      
      if (res.ok) {
        onChange(manualAddress);
        setManualAddress('');
        fetchAddresses();
        if (onAddressSaved) onAddressSaved();
      }
    } catch (error) {
      console.error('Failed to save address:', error);
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      const res = await fetch(`/api/user/addresses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAddresses();
      }
    } catch (error) {
      console.error('Failed to delete address:', error);
    }
  };

  const displayAddresses = showAll ? addresses : addresses.slice(0, 3);

  if (isLoading) {
    return <div className={styles.loader}>Загрузка адресов...</div>;
  }

  return (
    <div className={styles.container}>
      {addresses.length > 0 && (
        <div className={styles.addressList}>
          <div className={styles.listHeader}>
            <MapPin size={16} />
            <span>Последние адреса</span>
          </div>
          {displayAddresses.map(addr => (
            <div
              key={addr.id}
              className={`${styles.addressItem} ${value === addr.address ? styles.selected : ''}`}
              onClick={() => selectAddress(addr.address)}
            >
              <span>{addr.address}</span>
              <div className={styles.addressActions}>
                {value === addr.address && <Check size={16} className={styles.checkmark} />}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAddress(addr.id);
                  }}
                  className={styles.deleteBtn}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {addresses.length > 3 && !showAll && (
            <button onClick={() => setShowAll(true)} className={styles.showMoreBtn}>
              Показать все ({addresses.length})
            </button>
          )}
          {showAll && (
            <button onClick={() => setShowAll(false)} className={styles.showMoreBtn}>
              Скрыть
            </button>
          )}
        </div>
      )}

      <div className={styles.manualInput}>
        <input
          type="text"
          placeholder={addresses.length > 0 ? "Или введите новый адрес..." : "Введите адрес доставки"}
          value={manualAddress}
          onChange={(e) => setManualAddress(e.target.value)}
          className={styles.input}
        />
        <button
          onClick={saveAddress}
          disabled={!manualAddress.trim()}
          className={styles.saveBtn}
        >
          <Plus size={18} />
          Добавить
        </button>
      </div>

      {value && addresses.some(a => a.address === value) && (
        <div className={styles.selectedInfo}>
          <Check size={16} className={styles.checkmark} />
          Использован сохранённый адрес
        </div>
      )}
    </div>
  );
}