'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle, FileText, Shield, User, Database, Clock } from 'lucide-react';
import styles from './page.module.scss';

export default function ConsentPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={18} />
          На главную
        </Link>
        <div className={styles.titleWrapper}>
          <CheckCircle size={40} className={styles.icon} />
          <h1>Согласие на обработку персональных данных</h1>
          <p>Ресторан «Челентано»</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.infoBox}>
          <Clock size={18} />
          <span>Редакция от 27 сентября 2026 года</span>
        </div>

        <section className={styles.section}>
          <p>
            Настоящим я, субъект персональных данных, действуя свободно, своей волей 
            и в своём интересе, даю согласие Ресторану «Челентано» (далее — «Оператор»), 
            адрес: Республика Дагестан, г. Махачкала, ул. Агасиева, 5А, на обработку 
            моих персональных данных на условиях, изложенных ниже.
          </p>
        </section>

        <section className={styles.section}>
          <h2><User size={20} /> 1. Перечень персональных данных</h2>
          <p>Я даю согласие на обработку следующих персональных данных:</p>
          <ul>
            <li>фамилия, имя, отчество;</li>
            <li>номер контактного телефона;</li>
            <li>адрес электронной почты (email);</li>
            <li>адрес доставки заказа;</li>
            <li>дата рождения (при указании);</li>
            <li>история заказов и бронирований.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2><Database size={20} /> 2. Цели обработки данных</h2>
          <p>Обработка персональных данных осуществляется в следующих целях:</p>
          <ul>
            <li>оформление, обработка и доставка заказов;</li>
            <li>бронирование столиков и подтверждение брони;</li>
            <li>информирование о статусе заказа;</li>
            <li>предоставление скидок, бонусов и участие в программе лояльности;</li>
            <li>поздравление с днём рождения и предоставление праздничных скидок;</li>
            <li>улучшение качества обслуживания и анализ предпочтений гостей.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2><Shield size={20} /> 3. Действия с персональными данными</h2>
          <p>
            Согласие даётся на совершение следующих действий с персональными данными:
            сбор, запись, систематизация, накопление, хранение, уточнение (обновление, 
            изменение), извлечение, использование, передача (предоставление, доступ), 
            блокирование, удаление, уничтожение.
          </p>
        </section>

        <section className={styles.section}>
          <h2><FileText size={20} /> 4. Срок действия согласия</h2>
          <p>
            Согласие действует с момента его предоставления (оформления заказа, 
            бронирования столика или регистрации на сайте) и до момента его отзыва.
          </p>
          <p>
            Согласие может быть отозвано в любой момент путём направления письменного 
            уведомления Оператору по адресу: Республика Дагестан, г. Махачкала, 
            ул. Агасиева, 5А, или по электронной почте: info@chelentano05.ru.
          </p>
        </section>

        <section className={styles.section}>
          <h2>✅ 5. Подтверждение</h2>
          <p>
            Я подтверждаю, что ознакомлен(а) с <Link href="/privacy">Политикой 
            конфиденциальности</Link> Ресторана «Челентано», понимаю свои права 
            и обязанности, а также цели и условия обработки моих персональных данных.
          </p>
        </section>

        <section className={styles.section}>
          <h2>📞 6. Контактная информация</h2>
          <div className={styles.contacts}>
            <p><strong>Оператор:</strong> Ресторан «Челентано»</p>
            <p><strong>Адрес:</strong> Республика Дагестан, г. Махачкала, ул. Агасиева, 5А</p>
            <p><strong>Телефон:</strong> <a href="tel:+79882913293">+7 (988) 291-32-93</a></p>
            <p><strong>Email:</strong> <a href="mailto:info@chelentano05.ru">info@chelentano05.ru</a></p>
          </div>
        </section>

        <div className={styles.footer}>
          <p>© 2026 Ресторан «Челентано». Все права защищены.</p>
        </div>
      </div>
    </div>
  );
}