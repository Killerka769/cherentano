import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Регистрация',
    template: '%s | Челентано'
  },
  description: 'Зарегестрируйте аккаунт в личный кабинет ресторана Челентано, чтобы управлять заказами и бронированиями.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}