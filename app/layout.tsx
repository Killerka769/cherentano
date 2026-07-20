import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/app/components/layout/Header/Header';
import { CartProvider } from '@/app/contexts/CartContext';
import { AuthProvider } from '@/app/contexts/AuthContext';
import './globals.scss';
import { Toaster } from 'react-hot-toast';
import PageTransition from './components/ui/PageTransition/PageTransition';
import Footer from './components/layout/Footer/Footer';
import OrderReminder from './components/ui/OrderReminder/OrderReminder';

const inter = Inter({ subsets: ['cyrillic', 'latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Челентано | Ресторан дагестанской и европейской кухни в Махачкале',
    template: '%s | Челентано'
  },
  description: 'Ресторан дагестанской и европейской кухни в центре Махачкалы. Пицца, паста, стейки, чуду, хинкал, шашлык. Забронируйте столик или закажите еду онлайн.',
  keywords: 'ресторан Махачкала, Челентано, доставка еды, дагестанская кухня махачкала, европейская кухня махачкала, пицца, паста, стейки, чуду, хинкал, шашлык, Челентано махачкала, челентано ресторан Махачкала, махачкала челентано',
  authors: [{ name: 'Челентано' }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Челентано - Ресторан в Махачкале',
    description: 'Лучшая дагестанская кухня, уютная атмосфера, бесплатная доставка',
    url: 'https://chelentano05.ru',
    siteName: 'Челентано',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Ресторан Челентано',
      },
    ],
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Челентано - Ресторан в Махачкале',
    description: 'Лучшая дагестанская кухня, уютная атмосфера, бесплатная доставка',
    images: ['/images/og-image.jpg'],
  },
  verification: {
    yandex: 'ваш-ключ-яндекс-вебмастера',
    google: 'ваш-ключ-google-search-console',
  },
  alternates: {
    canonical: 'https://chelentano05.ru',
  },
  category: 'food',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#c4492c',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <Header />
            <OrderReminder />
            <main><PageTransition>{children}</PageTransition></main>
            <Toaster position="bottom-right" />
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}