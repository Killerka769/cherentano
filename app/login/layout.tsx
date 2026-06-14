import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Вход',
    template: '%s | Челентано'
  },
  description: 'Войдите в личный кабинет ресторана Челентано, чтобы управлять заказами и бронированиями.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}