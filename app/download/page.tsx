'use client';

import Link from 'next/link';
import { ArrowLeft, Smartphone, Download, Shield, Zap, Star, Bell, CheckCircle, Info } from 'lucide-react';
import styles from './page.module.scss';

export default function DownloadPage() {
  const apkUrl = '/downloads/Celentano.apk';
  const apkSize = '~10 МБ';
  const apkVersion = '1.0.0'; 

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={20} />
          На главную
        </Link>
      </div>

      <div className={styles.content}>
        {/* Иконка приложения */}
        <div className={styles.appIcon}>
          <Smartphone size={64} className={styles.appIconSvg} />
        </div>

        {/* Заголовок */}
        <h1 className={styles.title}>Приложение «Челентано»</h1>
        <p className={styles.subtitle}>
          Заказывайте еду, бронируйте столики и получайте скидки прямо с телефона
        </p>

        {/* Кнопка скачивания */}
        <a 
          href={apkUrl} 
          download="Celentano.apk"
          className={styles.downloadBtn}
        >
          <Download size={22} />
          Скачать для Android
        </a>

        <div className={styles.appInfo}>
          <span>Версия: {apkVersion}</span>
          <span>•</span>
          <span>Размер: {apkSize}</span>
          <span>•</span>
          <span>Android 8.0+</span>
        </div>

        {/* Преимущества */}
        <div className={styles.features}>
          <h2 className={styles.featuresTitle}>Что умеет приложение</h2>
          
          <div className={styles.featuresGrid}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <Zap size={22} />
              </div>
              <div>
                <strong>Быстрый заказ</strong>
                <p>Оформляйте заказ в пару кликов</p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <Star size={22} />
              </div>
              <div>
                <strong>Скидки</strong>
                <p>Копите и получайте скидки</p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <Bell size={22} />
              </div>
              <div>
                <strong>Статусы</strong>
                <p>Следите за статусом заказа</p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <Shield size={22} />
              </div>
              <div>
                <strong>Безопасно</strong>
                <p>Проверенный APK без вирусов</p>
              </div>
            </div>
          </div>
        </div>

        {/* Инструкция по установке */}
        <div className={styles.instructions}>
          <h2 className={styles.instructionsTitle}>
            <Info size={22} />
            Как установить приложение
          </h2>

          <div className={styles.steps}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <div>
                <strong>Скачайте APK-файл</strong>
                <p>Нажмите кнопку «Скачать для Android» выше</p>
              </div>
            </div>

            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <div>
                <strong>Разрешите установку</strong>
                <p>В настройках телефона разрешите установку из неизвестных источников</p>
              </div>
            </div>

            <div className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <div>
                <strong>Установите приложение</strong>
                <p>Откройте скачанный файл и нажмите «Установить»</p>
              </div>
            </div>

            <div className={styles.step}>
              <span className={styles.stepNumber}>4</span>
              <div>
                <strong>Готово!</strong>
                <p>Откройте приложение и войдите в свой аккаунт</p>
              </div>
            </div>
          </div>
        </div>

        {/* Предупреждение */}
        <div className={styles.warning}>
          <CheckCircle size={20} className={styles.warningIcon} />
          <div>
            <strong>Файл проверен</strong>
            <p>Приложение безопасно и не содержит вирусов. Устанавливайте только с нашего официального сайта.</p>
          </div>
        </div>

        {/* Альтернатива */}
        <div className={styles.alternative}>
          <p>
            Не хотите устанавливать приложение? Используйте{' '}
            <Link href="/">веб-версию сайта</Link> — она работает так же.
          </p>
        </div>
      </div>
    </div>
  );
}