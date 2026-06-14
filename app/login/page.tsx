'use client';

import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import { Mail, Phone, Lock, LogIn } from 'lucide-react';
import styles from './page.module.scss';

export default function LoginPage() {
  const { login } = useAuth();
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputType, setInputType] = useState<'email' | 'phone'>('email');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(loginInput, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setLoginInput(value);
    if (value.includes('@')) {
      setInputType('email');
    } else if (value.replace(/[^0-9+]/g, '').length >= 10) {
      setInputType('phone');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <LogIn size={48} className={styles.icon} />
          <h1>Вход в аккаунт</h1>
          <p>Войдите по email или номеру телефона</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.field}>
            {inputType === 'email' ? <Mail size={20} /> : <Phone size={20} />}
            <input
              type="text"
              placeholder="Email или номер телефона"
              value={loginInput}
              onChange={(e) => handleInputChange(e.target.value)}
              required
            />
          </div>
          
          <div className={styles.field}>
            <Lock size={20} />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        
        <p className={styles.register}>
          Нет аккаунта? <Link href="/register">Зарегистрироваться</Link>
        </p>
        <p className={styles.hint}>
          Подсказка: admin@cherentano.ru / admin123
        </p>
      </div>
    </div>
  );
}