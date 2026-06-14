import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Панель менеджера',
    template: '%s | Менеджер Челентано'
  },
  description: 'Управление заказами и бронированиями ресторана Челентано.',
  keywords: 'менеджер, заказы, бронирования, управление',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}