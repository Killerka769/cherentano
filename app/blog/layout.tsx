import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Блог',
    template: '%s | Блог Челентано'
  },
  description: 'Новости, события, истории наших гостей и секреты дагестанской кухни. Читайте блог ресторана Челентано в Махачкале.',
  keywords: 'блог ресторана, новости ресторана, дагестанская кухня, рецепты, события Махачкала',
  openGraph: {
    title: 'Блог ресторана Челентано',
    description: 'Новости, события и секреты дагестанской кухни',
    type: 'website',
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}