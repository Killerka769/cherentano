'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';

export const YANDEX_METRIKA_ID = 111106968;

declare global {
  interface Window {
    ym?: (counterId: number, method: string, ...args: unknown[]) => void;
  }
}

export default function YandexMetrika() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initedRef = useRef(false);
  const isFirstHitRef = useRef(true);

  const initCounter = () => {
    if (initedRef.current) return;
    if (typeof window === 'undefined' || typeof window.ym !== 'function') return;

    window.ym(YANDEX_METRIKA_ID, 'init', {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: 'dataLayer',
      accurateTrackBounce: true,
      trackLinks: true,
    });
    initedRef.current = true;
  };

  useEffect(() => {
    initCounter();
  }, []);

  useEffect(() => {
    if (isFirstHitRef.current) {
      isFirstHitRef.current = false;
      return;
    }

    if (typeof window === 'undefined' || typeof window.ym !== 'function') return;

    const query = searchParams.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    window.ym(YANDEX_METRIKA_ID, 'hit', url);
  }, [pathname, searchParams]);

  return (
    <>
      <Script
        id="yandex-metrika"
        src={`https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRIKA_ID}`}
        strategy="afterInteractive"
        onLoad={initCounter}
      />
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${YANDEX_METRIKA_ID}`}
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
