import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Меню на неделю',
    template: '%s | Челентано'
  },
  description: 'Планируйте свои заказы заранее! Меню ресторана Челентано на неделю: дагестанская и европейская кухня в Махачкале. Блюда по дням.',
  keywords: 'меню на неделю, планирование заказов, меню ресторана, Челентано, Махачкала, блюда по дням, меню ресторана челентано, челентано меню недели',
  robots: {
    index: true, 
    follow: true,
  },
  openGraph: {
    title: 'Меню на неделю в Челентано',
    description: 'Планируйте свои заказы заранее. Блюда дагестанской и европейской кухни по дням недели.',
    type: 'website',
    url: 'https://chelentano05.ru/weekly-menu',
    images: [
      {
        url: '/images/weekly-menu-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Меню на неделю в ресторане Челентано',
      },
    ],
  },
}

export default function WeeklyMenuLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}