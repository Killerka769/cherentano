import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Отзывы о ресторане',
    template: '%s | Челентано'
  },
  description: 'Отзывы гостей о ресторане Челентано в Махачкале. Что говорят о нашей кухне, обслуживании и атмосфере.',
  keywords: 'отзывы ресторана, отзывы Челентано, ресторан Махачкала отзывы',
  robots: {
    index: true,   
    follow: true, 
  },
  openGraph: {
    title: 'Отзывы о ресторане Челентано',
    description: 'Что говорят наши гости о ресторане Челентано',
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