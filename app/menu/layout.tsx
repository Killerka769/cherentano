import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Меню ресторана',
    template: '%s | Челентано'
  },
  description: 'Меню ресторана Челентано в Махачкале: дагестанская и европейская кухня. Пицца, чуду, шашлык, паста, хинкал, стейки. Доставка и самовывоз.',
  keywords: 'меню ресторана, меню Челентано, дагестанская кухня, европейская кухня, пицца, шашлык, хинкал, чуду, доставка еды Махачкала, меню ресторана челентано, челентано меню',
  robots: {
    index: true,  
    follow: true,  
  },
  alternates: {
    canonical: 'https://chelentano05.ru/menu', 
  },
  openGraph: {
    title: 'Меню ресторана Челентано',
    description: 'Ознакомьтесь с нашим меню: дагестанская и европейская кухня в Махачкале',
    type: 'website',
    url: 'https://chelentano05.ru/menu',
  },
}

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}