'use client';

import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import { Mail, Lock, User, Phone, UserPlus } from 'lucide-react';
import styles from './page.module.scss';
import PhoneInput from '../components/ui/PhoneInput/PhoneInput';

export default function RegisterPage() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreed) {
      setError('Необходимо согласие на обработку персональных данных');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        name: formData.name
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <UserPlus size={48} className={styles.icon} />
          <h1>Регистрация</h1>
          <p>Создайте аккаунт для заказов</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.field}>
            <User size={20} />
            <input
              type="text"
              placeholder="Ваше имя"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div className={styles.field}>
            <Mail size={20} />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          
          <div className={styles.field}>
            <Phone size={20} />
            <PhoneInput
              value={formData.phone}
              onChange={(value) => setFormData({ ...formData, phone: value })}
              required
              className={styles.input}
            />
          </div>
          
          <div className={styles.field}>
            <Lock size={20} />
            <input
              type="password"
              placeholder="Пароль"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          
          <div className={styles.field}>
            <Lock size={20} />
            <input
              type="password"
              placeholder="Подтвердите пароль"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>

          <div className={styles.agreement}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />
              <span>
                Я согласен(на) на <a href="/privacy" target="_blank">обработку персональных данных</a>
              </span>
            </label>
          </div>
          
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        
        <p className={styles.login}>
          Уже есть аккаунт? <Link href="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}