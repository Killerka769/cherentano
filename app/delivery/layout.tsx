import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Доставка еды',
    template: '%s | Челентано'
  },
  description: 'Доставка еды из ресторана Челентано в Махачкале. Быстро, вкусно, горячо. Закажите прямо сейчас!',
  keywords: 'доставка еды Махачкала, доставка Челентано, заказать еду, быстрая доставка, челентано доставка, доставка еды челентано, заказать еду челентано',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Доставка еды из Челентано',
    description: 'Закажите доставку еды из ресторана Челентано в Махачкале',
    type: 'website',
  },
}

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}