import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Скачать приложение',
  description: 'Скачайте официальное приложение ресторана Челентано для Android. Быстрый заказ, бонусы, уведомления о статусе заказа.',
  keywords: 'приложение челентано, скачать приложение, apk ресторан, приложение для заказа еды, еда 05, еда приложение, махачкала еда приложение, шашлыки приложение',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://chelentano05.ru/download',
  },
  openGraph: {
    title: 'Скачать приложение «Челентано»',
    description: 'Заказывайте еду и бронируйте столики прямо с телефона',
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