'use client';

import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import { Mail, Lock, User, Phone, UserPlus, Calendar, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import styles from './page.module.scss';
import PhoneInput from '../components/ui/PhoneInput/PhoneInput';

export default function RegisterPage() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    birthDate: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Минимум 8 символов');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Хотя бы одна заглавная буква');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Хотя бы одна строчная буква');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Хотя бы одна цифра');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Хотя бы один спецсимвол (!@#$%^&*)');
    }
    
    return errors;
  };

  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, password: value });
    const errors = validatePassword(value);
    setPasswordErrors(errors);
  };

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

    const errors = validatePassword(formData.password);
    if (errors.length > 0) {
      setError('Пароль не соответствует требованиям безопасности');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        name: formData.name,
        birthDate: formData.birthDate || undefined
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
            <Calendar size={20} />
            <input
              type="date"
              placeholder="Дата рождения"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              className={styles.input}
            />
          </div>
          
          {/* Пароль с глазиком */}
          <div className={styles.field}>
            <Lock size={20} />
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Пароль"
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className={styles.eyeBtn}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          {/* Индикатор сложности пароля */}
          {formData.password.length > 0 && (
            <div className={styles.passwordRequirements}>
              <div className={styles.passwordStrength}>
                <span className={
                  passwordErrors.length === 0 ? styles.strong : 
                  passwordErrors.length <= 2 ? styles.medium : styles.weak
                }>
                  {passwordErrors.length === 0 ? '✅ Надёжный пароль' :
                   passwordErrors.length <= 2 ? '⚠️ Средний пароль' :
                   '❌ Слабый пароль'}
                </span>
                <span className={styles.strengthBar}>
                  <span 
                    className={styles.strengthFill} 
                    style={{ 
                      width: `${Math.max(0, 100 - passwordErrors.length * 20)}%`,
                      background: passwordErrors.length === 0 ? '#4caf50' :
                                 passwordErrors.length <= 2 ? '#ff9800' : '#f44336'
                    }}
                  />
                </span>
              </div>
              <ul className={styles.requirementsList}>
                <li className={formData.password.length >= 8 ? styles.valid : styles.invalid}>
                  {formData.password.length >= 8 ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  Минимум 8 символов
                </li>
                <li className={/[A-Z]/.test(formData.password) ? styles.valid : styles.invalid}>
                  {/[A-Z]/.test(formData.password) ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  Заглавная буква
                </li>
                <li className={/[a-z]/.test(formData.password) ? styles.valid : styles.invalid}>
                  {/[a-z]/.test(formData.password) ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  Строчная буква
                </li>
                <li className={/[0-9]/.test(formData.password) ? styles.valid : styles.invalid}>
                  {/[0-9]/.test(formData.password) ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  Цифра
                </li>
                <li className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? styles.valid : styles.invalid}>
                  {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  Спецсимвол (!@#$%^&*)
                </li>
              </ul>
            </div>
          )}
          
          {/* Подтверждение пароля с глазиком */}
          <div className={styles.field}>
            <Lock size={20} />
            <div className={styles.passwordWrapper}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Подтвердите пароль"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                className={styles.eyeBtn}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          {formData.confirmPassword && formData.password === formData.confirmPassword && (
            <span className={styles.match}>✅ Пароли совпадают</span>
          )}
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <span className={styles.mismatch}>❌ Пароли не совпадают</span>
          )}
            
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