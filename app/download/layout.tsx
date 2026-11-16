import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Установить приложение',
  description: 'Установите Челентано на телефон через браузер: заказ еды и бронь стола с ярлыка на экране, без APK.',
  keywords: 'приложение челентано, установить приложение, pwa челентано, заказ еды махачкала, бронь стола челентано',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://chelentano05.ru/download',
  },
  openGraph: {
    title: 'Установить приложение «Челентано»',
    description: 'Ярлык на экране телефона: заказ еды и бронь стола без строки браузера',
    type: 'website',
    url: 'https://chelentano05.ru/download',
  },
}

export default function DownloadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}