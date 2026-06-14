import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Оформление заказа',
    template: '%s | Челентано'
  },
  description: 'Оформите заказ с доставкой или самовывозом.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}