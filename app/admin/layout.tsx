import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Панель управления',
    template: '%s | Админ-панель Челентано'
  },
  description: 'Управление рестораном: заказы, меню, пользователи, бронирования, столики и настройки.',
  keywords: 'админ-панель, управление рестораном, заказы, меню, пользователи',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Панель управления | Челентано',
    description: 'Управление рестораном Челентано',
    type: 'website',
  },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}