import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Контакты ресторана',
    template: '%s | Челентано'
  },
  description: 'Как нас найти: адрес ресторана в Махачкале, телефон, режим работы, схема проезда. ул. Агасиева, 5А.',
  keywords: 'контакты ресторана, адрес ресторана, телефон ресторана, Махачкала ресторан, как добраться, челентано, номер челентано, челентано контакты',
  robots: {
    index: true,  
    follow: true, 
  },
  openGraph: {
    title: 'Контакты ресторана Челентано',
    description: 'Адрес, телефон и режим работы ресторана в Махачкале',
    type: 'website',
  },
}

export default function ContactsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}