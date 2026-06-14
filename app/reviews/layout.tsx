import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Отзывы',
    template: '%s | Блог Челентано'
  },
  description: 'Что говорят наши гости о ресторане Челентано',
  keywords: 'отзывы ресторана,отзывы, отзывы челентано',
  openGraph: {
    title: 'Отзывы ресторана Челентано',
    description: 'Отзывы',
    type: 'website',
  },
}

export default function ReviewsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}