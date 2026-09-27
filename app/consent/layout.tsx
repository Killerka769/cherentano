import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Согласие на обработку персональных данных',
  description: 'Согласие на обработку персональных данных ресторана Челентано.',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://chelentano05.ru/consent',
  },
}

export default function ConsentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}