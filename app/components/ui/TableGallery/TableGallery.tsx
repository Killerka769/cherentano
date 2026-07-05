'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Users, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import ImageWithFallback from '@/app/components/ui/ImageWithFallback/ImageWithFallback';
import styles from './TableGallery.module.scss';

interface Booking {
  id: string;
  date: string;
  time: string;
  endTime: string | null;
  status: string;
  customerName: string;
}

interface Table {
  id: number;
  number: number;
  seats: number;
  name: string | null;
  description: string | null;
  imageUrl: string | null;
  images: string[] | null;
  purpose: string | null;
  bookings: Booking[];
}

interface TableGalleryProps {
  table: Table;
  onClose: () => void;
}

export default function TableGallery({ table, onClose }: TableGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Собираем все изображения для галереи
  const allImages = table.images || (table.imageUrl ? [table.imageUrl] : []);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // Фильтруем брони на выбранную дату
  const bookingsOnDate = table.bookings.filter(b => 
    new Date(b.date).toISOString().split('T')[0] === selectedDate
  );

  // Закрытие по Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Закрытие */}
        <button onClick={onClose} className={styles.closeBtn}>
          <X size={24} />
        </button>

        <div className={styles.content}>
          {/* Галерея */}
          <div className={styles.gallery}>
            {allImages.length > 0 ? (
              <>
                <div className={styles.imageContainer}>
                  <ImageWithFallback
                    src={allImages[currentImageIndex]}
                    alt={`Столик ${table.number}`}
                    className={styles.mainImage}
                    fallback="default"
                  />
                  {allImages.length > 1 && (
                    <>
                      <button onClick={prevImage} className={`${styles.navBtn} ${styles.prevBtn}`}>
                        <ChevronLeft size={24} />
                      </button>
                      <button onClick={nextImage} className={`${styles.navBtn} ${styles.nextBtn}`}>
                        <ChevronRight size={24} />
                      </button>
                      <div className={styles.imageCounter}>
                        {currentImageIndex + 1} / {allImages.length}
                      </div>
                    </>
                  )}
                </div>
                {allImages.length > 1 && (
                  <div className={styles.thumbnails}>
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`${styles.thumbnail} ${currentImageIndex === idx ? styles.active : ''}`}
                      >
                        <ImageWithFallback
                          src={img}
                          alt={`Фото ${idx + 1}`}
                          fallback="default"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className={styles.noImage}>
                <div className={styles.noImageIcon}>🪑</div>
                <p>Фото кабинки в разработке</p>
              </div>
            )}
          </div>

          {/* Информация о кабинке */}
          <div className={styles.info}>
            <div className={styles.header}>
              <h2 className={styles.title}>
                Кабинка №{table.number}
                {table.name && <span className={styles.name}>{table.name}</span>}
              </h2>
              <div className={styles.badge}>
                <Users size={14} />
                {table.seats} места
              </div>
              {table.purpose && (
                <div className={styles.purpose}>
                  🎯 {table.purpose}
                </div>
              )}
            </div>

            {table.description && (
              <p className={styles.description}>{table.description}</p>
            )}

            {/* Занятость */}
            <div className={styles.bookingSection}>
              <div className={styles.bookingHeader}>
                <Calendar size={16} />
                <span>Занятость на дату:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={styles.dateInput}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {bookingsOnDate.length === 0 ? (
                <div className={styles.free}>
                  <CheckCircle size={20} />
                  <span>Свободно на выбранную дату</span>
                </div>
              ) : (
                <div className={styles.bookingsList}>
                  {bookingsOnDate.map(booking => (
                    <div key={booking.id} className={styles.bookingItem}>
                      <div className={styles.bookingTime}>
                        <Clock size={14} />
                        <span>{booking.time}</span>
                        {booking.endTime && (
                          <span>— {booking.endTime}</span>
                        )}
                      </div>
                      <div className={styles.bookingStatus}>
                        {booking.status === 'CONFIRMED' ? (
                          <span className={styles.confirmed}>✅ Подтверждено</span>
                        ) : (
                          <span className={styles.pending}>⏳ Ожидает</span>
                        )}
                      </div>
                      <div className={styles.bookingCustomer}>
                        👤 {booking.customerName}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}