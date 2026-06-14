'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, FileText, Eye, Database, Lock, Clock } from 'lucide-react';
import styles from './page.module.scss';

export default function PrivacyPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={18} />
          На главную
        </Link>
        <div className={styles.titleWrapper}>
          <Shield size={40} className={styles.icon} />
          <h1>Политика конфиденциальности</h1>
          <p>Ресторан «Челентано»</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.infoBox}>
          <Clock size={18} />
          <span>Актуально с 1 января 2026 года</span>
        </div>

        <section className={styles.section}>
          <h2><FileText size={20} /> 1. Общие положения</h2>
          <p>
            Настоящая политика обработки персональных данных составлена в соответствии с требованиями 
            Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных» и определяет порядок 
            обработки персональных данных и меры по обеспечению безопасности персональных данных, 
            предпринимаемые рестораном «Челентано».
          </p>
        </section>

        <section className={styles.section}>
          <h2><Database size={20} /> 2. Какие данные мы собираем</h2>
          <ul>
            <li><strong>Фамилия, имя, отчество</strong> — для персонализации общения</li>
            <li><strong>Номер телефона</strong> — для связи по заказу и подтверждения брони</li>
            <li><strong>Email</strong> — для отправки уведомлений о статусе заказа</li>
            <li><strong>Адрес доставки</strong> — для осуществления доставки</li>
            <li><strong>История заказов</strong> — для улучшения качества обслуживания</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2><Eye size={20} /> 3. Как мы используем ваши данные</h2>
          <ul>
            <li>Оформление и обработка заказов</li>
            <li>Бронирование столиков</li>
            <li>Уведомление о статусе заказа</li>
            <li>Улучшение качества обслуживания</li>
            <li>Анализ предпочтений гостей</li>
            <li>Начисление бонусов и уровней лояльности</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2><Lock size={20} /> 4. Защита персональных данных</h2>
          <p>
            Мы принимаем необходимые организационные и технические меры для защиты вашей 
            персональной информации от неправомерного или случайного доступа, уничтожения, 
            изменения, блокирования, копирования, распространения, а также от иных неправомерных 
            действий третьих лиц.
          </p>
        </section>

        <section className={styles.section}>
          <h2>🔒 5. Хранение данных</h2>
          <p>
            Ваши персональные данные хранятся на защищённых серверах в течение всего срока 
            использования вами нашего сайта. Вы можете в любой момент запросить удаление своих 
            данных, обратившись к администратору.
          </p>
        </section>

        <section className={styles.section}>
          <h2>📞 6. Контактная информация</h2>
          <p>
            По всем вопросам, связанным с обработкой персональных данных, вы можете обратиться:
          </p>
          <div className={styles.contacts}>
            <p><strong>Телефон:</strong> <a href="tel:+79882938907">+7 (988) 293-89-07</a></p>
            <p><strong>Email:</strong> <a href="mailto:info@cherentano.ru">info@cherentano.ru</a></p>
            <p><strong>Адрес:</strong> Республика Дагестан, Махачкала, ул. Агасиева, 5А</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>✅ 7. Ваши права</h2>
          <ul>
            <li>Получать информацию о том, какие ваши данные хранятся</li>
            <li>Требовать исправления неточных данных</li>
            <li>Требовать удаления данных</li>
            <li>Отозвать согласие на обработку данных в любой момент</li>
          </ul>
        </section>

        <div className={styles.footer}>
          <p>© 2026 Ресторан «Челентано». Все права защищены.</p>
        </div>
      </div>
    </div>
  );
}