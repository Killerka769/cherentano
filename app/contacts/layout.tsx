import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Контакты',
    template: '%s | Челентано'
  },
  description: 'Как нас найти: адрес, телефон, режим работы, схема проезда.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ContactsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}