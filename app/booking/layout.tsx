import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Бронирование столика',
    template: '%s | Блог Челентано'
  },
  description: 'Забронируйте столик в ресторане Челентано онлайн',
  keywords: 'забронировать столик, забронировать, столик, столик челентано, забронировать столик челентано',
  openGraph: {
    title: 'Бронирование столика ресторана Челентано',
    description: 'Бронирование столика',
    type: 'website',
  },
}

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}