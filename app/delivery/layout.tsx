import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Доставка',
    template: '%s | Челентано'
  },
  description: 'Информация о доставке ресторана Челентано',
  robots: {
    index: false,
    follow: false,
  },
}

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}