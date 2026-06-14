'use client';

import { useState, useEffect, forwardRef } from 'react';

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  name?: string;
}

// Список допустимых кодов операторов
const VALID_CODES = [
  '901', '902', '903', '904', '905', '906', '908', '909',
  '910', '911', '912', '913', '914', '915', '916', '917', '918', '919',
  '920', '921', '922', '923', '924', '925', '926', '927', '928', '929',
  '930', '931', '932', '933', '934', '935', '936', '937', '938', '939',
  '950', '951', '952', '953', '954', '955', '956', '957', '958', '959',
  '960', '961', '962', '963', '964', '965', '966', '967', '968', '969',
  '970', '971', '972', '973', '974', '975', '976', '977', '978', '979',
  '980', '981', '982', '983', '984', '985', '986', '987', '988', '989',
  '990', '991', '992', '993', '994', '995', '996', '997', '998', '999'
];

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(({
  value = '',
  onChange,
  onBlur,
  placeholder = '+7 (___) ___-__-__',
  required = false,
  className = '',
  disabled = false,
  name
}, ref) => {
  const [maskedValue, setMaskedValue] = useState('');
  const [error, setError] = useState('');

  // Форматирование номера
  const formatPhoneNumber = (digits: string): string => {
    let formatted = '+7';
    if (digits.length > 0) {
      formatted += ` (${digits.slice(0, 3)}`;
    }
    if (digits.length > 3) {
      formatted += `) ${digits.slice(3, 6)}`;
    }
    if (digits.length > 6) {
      formatted += `-${digits.slice(6, 8)}`;
    }
    if (digits.length > 8) {
      formatted += `-${digits.slice(8, 10)}`;
    }
    return formatted;
  };

  // Валидация кода оператора
  const validateOperator = (digits: string): boolean => {
    if (digits.length !== 10) return true; // Неполный номер не валидируем
    const operatorCode = digits.slice(0, 3);
    if (!VALID_CODES.includes(operatorCode)) {
      setError(`Код оператора ${operatorCode} не обслуживается`);
      return false;
    }
    setError('');
    return true;
  };

  // Обновление при изменении внешнего value
  useEffect(() => {
    const digits = value.replace(/\D/g, '').replace(/^[78]/, '');
    const formatted = formatPhoneNumber(digits);
    if (formatted !== maskedValue) {
      setMaskedValue(formatted);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '');
    
    // Удаляем первую 7 или 8, если она есть
    if (input.startsWith('7') || input.startsWith('8')) {
      input = input.slice(1);
    }
    
    // Ограничиваем 10 цифрами
    if (input.length > 10) input = input.slice(0, 10);
    
    // Форматируем для отображения
    const formatted = formatPhoneNumber(input);
    setMaskedValue(formatted);
    
    // Валидация
    validateOperator(input);
    
    // Возвращаем raw значение (11 цифр с 7)
    const rawValue = input.length > 0 ? '7' + input : '';
    onChange?.(rawValue);
  };

  const handleBlur = () => {
    const digits = maskedValue.replace(/\D/g, '');
    if (digits.length > 0 && digits.length !== 11) {
      setError('Введите полный номер (11 цифр)');
    }
    onBlur?.();
  };

  const handleFocus = () => {
    setError('');
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        ref={ref}
        type="tel"
        name={name}
        value={maskedValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`${className} ${error ? 'phone-input-error' : ''}`}
        inputMode="numeric"
        autoComplete="off"
      />
      {error && (
        <span style={{ 
          position: 'absolute', 
          bottom: '-20px', 
          left: 0, 
          fontSize: '0.7rem', 
          color: '#f44336' 
        }}>
          {error}
        </span>
      )}
    </div>
  );
});

PhoneInput.displayName = 'PhoneInput';

export default PhoneInput;