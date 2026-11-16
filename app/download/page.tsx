'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Download,
  Info,
  Share,
  Smartphone,
  SquarePlus,
  Star,
  Zap,
} from 'lucide-react';
import { usePwa } from '@/app/components/pwa/PwaContext';
import styles from './page.module.scss';

export default function DownloadPage() {
  const { canInstall, isInstalled, isIos, isAndroid, install } = usePwa();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isInstalled) {
      setMessage('Приложение уже установлено. Открывайте его с экрана телефона.');
    }
  }, [isInstalled]);

  const scrollToSteps = () => {
    const el = document.getElementById('install-steps');
    if (!el) return;
    const top = window.scrollY + el.getBoundingClientRect().top - 140;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const handleInstall = async () => {
    if (!canInstall) {
      scrollToSteps();
      return;
    }

    setBusy(true);
    setMessage('');
    const result = await install();
    setBusy(false);

    if (result === 'accepted') {
      setMessage('Готово. Ищите «Челентано» на экране телефона.');
      return;
    }

    if (result === 'dismissed') {
      setMessage('Установку можно повторить в любой момент.');
      return;
    }

    scrollToSteps();
  };

  const buttonLabel = isInstalled
    ? 'Приложение установлено'
    : busy
      ? 'Открываем диалог…'
      : canInstall
        ? 'Установить приложение'
        : isIos
          ? 'Как установить на iPhone'
          : 'Как установить';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={20} />
          На главную
        </Link>
      </div>

      <div className={styles.content}>
        <div className={styles.appIcon}>
          <img
            src="/android-chrome-192x192.png"
            alt="Челентано"
            width={96}
            height={96}
          />
        </div>

        <h1 className={styles.title}>Приложение «Челентано»</h1>
        <p className={styles.subtitle}>
          Ярлык на экране телефона: заказ и бронь без строки браузера. Отдельный APK не нужен.
        </p>

        <button
          type="button"
          className={`${styles.downloadBtn} ${isInstalled ? styles.installed : ''}`}
          onClick={handleInstall}
          disabled={busy || isInstalled}
        >
          {isInstalled ? <CheckCircle size={22} /> : <Download size={22} />}
          {buttonLabel}
        </button>

        <div className={styles.appInfo}>
          <span>Бесплатно</span>
          <span>•</span>
          <span>Android и iPhone</span>
          <span>•</span>
          <span>Через браузер</span>
        </div>

        {message ? <p className={styles.status}>{message}</p> : null}

        <div className={styles.features}>
          <h2 className={styles.featuresTitle}>Что будет на телефоне</h2>

          <div className={styles.featuresGrid}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <Zap size={22} />
              </div>
              <div>
                <strong>Быстрый заказ</strong>
                <p>Меню, корзина и оформление в пару касаний</p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <Calendar size={22} />
              </div>
              <div>
                <strong>Бронь стола</strong>
                <p>Свободное время и кабинки без звонка</p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <Star size={22} />
              </div>
              <div>
                <strong>Скидки</strong>
                <p>Профиль, уровни и накопленные скидки под рукой</p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <Smartphone size={22} />
              </div>
              <div>
                <strong>Как приложение</strong>
                <p>Открывается на весь экран, без вкладок Chrome</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.instructions} id="install-steps">
          <h2 className={styles.instructionsTitle}>
            <Info size={22} />
            Как установить
          </h2>

          <div className={styles.platformBlock}>
            <h3>Android — Chrome</h3>
            {canInstall ? (
              <p className={styles.platformLead}>
                Нажмите «Установить приложение» выше — откроется системное окно браузера.
              </p>
            ) : (
              <p className={styles.platformLead}>
                Chrome сам предложит установку, когда сайт будет готов. Если окна нет, поставьте вручную:
              </p>
            )}
            <div className={styles.steps}>
              <div className={styles.step}>
                <span className={styles.stepNumber}>1</span>
                <div>
                  <strong>Откройте сайт в Chrome</strong>
                  <p>Другие браузеры на Android установку часто не предлагают</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>2</span>
                <div>
                  <strong>Нажмите кнопку на этой странице</strong>
                  <p>Или меню Chrome → «Установить приложение» / «Добавить на главный экран»</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>3</span>
                <div>
                  <strong>Подтвердите в окне браузера</strong>
                  <p>Появится ярлык «Челентано» на экране телефона</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`${styles.platformBlock} ${isIos ? styles.platformActive : ''}`}>
            <h3>iPhone — Safari</h3>
            <p className={styles.platformLead}>
              На iPhone браузер не показывает кнопку установки сам. Добавьте сайт на экран Домой:
            </p>
            <div className={styles.steps}>
              <div className={styles.step}>
                <span className={styles.stepNumber}>1</span>
                <div>
                  <strong>Откройте сайт в Safari</strong>
                  <p>Установка из Chrome на iPhone не сработает</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>2</span>
                <div>
                  <strong>
                    Нажмите «Поделиться» <Share size={14} className={styles.inlineIcon} />
                  </strong>
                  <p>Кнопка внизу экрана, квадрат со стрелкой вверх</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>3</span>
                <div>
                  <strong>
                    «На экран Домой» <SquarePlus size={14} className={styles.inlineIcon} />
                  </strong>
                  <p>Подтвердите имя «Челентано» и нажмите «Добавить»</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.warning}>
          <CheckCircle size={20} className={styles.warningIcon} />
          <div>
            <strong>Без APK и неизвестных источников</strong>
            <p>
              Это не сторонний файл. Устанавливает сам браузер, как обычное приложение с сайта.
              Если раньше ставили старый APK — удалите его и поставьте заново этим способом.
            </p>
          </div>
        </div>

        <div className={styles.alternative}>
          <p>
            Можно пользоваться и без установки:{' '}
            <Link href="/">открыть сайт</Link>
            {isAndroid ? ' в Chrome' : isIos ? ' в Safari' : ''}.
          </p>
        </div>
      </div>
    </div>
  );
}
