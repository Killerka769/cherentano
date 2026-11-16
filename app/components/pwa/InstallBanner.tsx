'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Download, X } from 'lucide-react';
import { usePwa } from './PwaContext';
import styles from './InstallBanner.module.scss';

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

export default function InstallBanner() {
  const { canInstall, isInstalled, install } = usePwa();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!canInstall || isInstalled || pathname === '/download') {
      setVisible(false);
      return;
    }

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_MS) return;

    const timer = window.setTimeout(() => setVisible(true), 2500);
    return () => window.clearTimeout(timer);
  }, [canInstall, isInstalled, pathname]);

  if (!visible) return null;

  const handleInstall = async () => {
    setBusy(true);
    const result = await install();
    setBusy(false);
    if (result !== 'unavailable') setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  return (
    <div className={styles.banner} role="dialog" aria-label="Установить приложение Челентано">
      <img
        src="/android-chrome-192x192.png"
        alt=""
        width={48}
        height={48}
        className={styles.icon}
      />
      <div className={styles.text}>
        <strong>Установить Челентано</strong>
        <p>Ярлык на экране телефона — заказ и бронь без браузера</p>
      </div>
      <button
        type="button"
        className={styles.installBtn}
        onClick={handleInstall}
        disabled={busy}
      >
        <Download size={16} />
        {busy ? 'Открываем…' : 'Установить'}
      </button>
      <button
        type="button"
        className={styles.closeBtn}
        onClick={handleDismiss}
        aria-label="Закрыть"
      >
        <X size={16} />
      </button>
    </div>
  );
}
