import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Корзина',
    template: '%s | Челентано'
  },
  description: 'Ваша корзина заказов в ресторане Челентано.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function CartLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}