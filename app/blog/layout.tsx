import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Блог ресторана',
    template: '%s | Челентано'
  },
  description: 'Блог ресторана Челентано: новости, события, рецепты, истории наших гостей и секреты дагестанской кухни.',
  keywords: 'блог ресторана, новости ресторана, рецепты дагестанской кухни, события Махачкала, челентано блог, блог челентано, блог ресторана Челентано, блоги челентано',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Блог ресторана Челентано',
    description: 'Новости, события, рецепты и истории нашего ресторана',
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