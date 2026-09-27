import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Публичная оферта',
  description: 'Условия оформления заказов, доставки и бронирования столиков в ресторане Челентано.',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://chelentano05.ru/offer',
  },
}

export default function OfferLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}