import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Бронирование столика',
    template: '%s | Челентано'
  },
  description: 'Забронируйте столик в ресторане Челентано в Махачкале. Уютные кабинки, живая музыка, отличная кухня.',
  keywords: 'бронирование столика, забронировать столик, ресторан Махачкала, кабинки ресторана, челентано кабинки, столы челентано, бронирование стола челентано, стол челентано, челентано кабины, челентано кабинки, забронировать челентано',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://chelentano05.ru/booking', 
  },
  openGraph: {
    title: 'Бронирование столика в Челентано',
    description: 'Забронируйте столик в ресторане Челентано в Махачкале',
    type: 'website',
    url: 'https://chelentano05.ru/booking',
  },
}

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}