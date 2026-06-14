import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Личный кабинет',
    template: '%s | Челентано'
  },
  description: 'Управляйте своим профилем, просматривайте историю заказов и бронирований в ресторане Челентано.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}