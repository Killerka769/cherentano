'use client';

import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" style={{ textDecoration: 'none' }}>
      <div style={{ lineHeight: 1.2 }}>
        <div style={{
          fontSize: '1.8rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #c4492c, #e67e22)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          letterSpacing: '-0.02em'
        }}>
          Челентано
        </div>
        <div style={{
          fontSize: '0.7rem',
          color: '#b96f3a',
          fontWeight: 500,
          marginTop: 2
        }}>
          Ресторан & Доставка
        </div>
      </div>
    </Link>
  );
}