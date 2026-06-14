import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Меню',
    template: '%s | Челентано'
  },
  description: 'Ознакомьтесь с нашим меню: пицца, чуду, шашлык, паста и т.д.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}