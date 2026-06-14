import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// ============ КОНФИГУРАЦИЯ МАРШРУТОВ ============

// Публичные маршруты (доступны всем, даже без авторизации)
const PUBLIC_PATHS = [
  '/',                    // Главная
  '/menu',                // Меню
  '/menu/',               // Меню с параметрами
  '/blog',                // Блог
  '/blog/',               // Блог с параметрами
  '/reviews',             // Отзывы
  '/contacts',            // Контакты
  '/about',               // О нас
  '/privacy',             // Политика конфиденциальности
  '/login',               // Вход
  '/register',            // Регистрация
  '/cart',                // Корзина (доступна всем, но для заказа нужна авторизация)
]

// Публичные API (доступны без авторизации)
const PUBLIC_API_PATHS = [
  '/api/dishes',
  '/api/categories',
  '/api/reviews',
  '/api/blog/posts',
  '/api/blog/comments',
  '/api/user/',           // Публичный просмотр профилей
  '/api/tables',          // Получение списка столов (для просмотра)
]

// Маршруты только для гостей (не для авторизованных)
const GUEST_ONLY_PATHS = [
  '/login',
  '/register',
]

// Маршруты для авторизованных пользователей (любая роль)
const AUTH_PATHS = [
  '/profile',             // Личный кабинет
  '/profile/',            // Профиль пользователя
  '/checkout',            // Оформление заказа
  '/booking',             // Бронирование стола
  '/booking/',            // Бронирование стола с параметрами
  '/api/orders',          // API заказов
  '/api/bookings',        // API бронирований
  '/api/favorites',       // API избранного
  '/api/saved-carts',     // API сохраненных корзин
  '/api/user/update',     // API обновления профиля
]

// Маршруты для менеджеров и админов
const MANAGER_PATHS = [
  '/manager',             // Панель менеджера
  '/manager/',            // Панель менеджера с параметрами
  '/api/manager/',        // API менеджера
]

// Маршруты только для админов
const ADMIN_PATHS = [
  '/admin',               // Админ-панель
  '/admin/',              // Админ-панель с параметрами
  '/api/admin/',          // API админа
]

// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============

// Проверка, соответствует ли путь паттерну
function matchesPath(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    if (pattern.endsWith('/')) {
      return pathname.startsWith(pattern)
    }
    return pathname === pattern || pathname.startsWith(pattern + '/')
  })
}

// Проверка, является ли путь API
function isApiPath(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

// Получение роли из токена
async function getUserRole(token: string): Promise<string | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    return payload.role as string
  } catch {
    return null
  }
}

// ============ ОСНОВНАЯ ФУНКЦИЯ MIDDLEWARE ============

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // ============ 1. ПРОВЕРКА ПУБЛИЧНЫХ МАРШРУТОВ ============
  if (matchesPath(pathname, PUBLIC_PATHS)) {
    return NextResponse.next()
  }
  
  // ============ 2. ПРОВЕРКА ПУБЛИЧНЫХ API ============
  if (isApiPath(pathname)) {
    // Публичные API эндпоинты
    if (matchesPath(pathname, PUBLIC_API_PATHS)) {
      // Для GET запросов - разрешаем всем
      if (request.method === 'GET') {
        return NextResponse.next()
      }
      // Для POST/PUT/DELETE - проверяем авторизацию ниже
    }
  }
  
  // ============ 3. ПОЛУЧЕНИЕ ТОКЕНА ============
  const token = request.cookies.get('token')?.value
  const isAuthenticated = !!token
  
  // ============ 4. ПРОВЕРКА ГОСТЕВЫХ МАРШРУТОВ ============
  if (matchesPath(pathname, GUEST_ONLY_PATHS) && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  // ============ 5. ПРОВЕРКА МАРШРУТОВ ДЛЯ АВТОРИЗОВАННЫХ ============
  if (matchesPath(pathname, AUTH_PATHS)) {
    if (!isAuthenticated) {
      // Сохраняем URL для редиректа после входа
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    return NextResponse.next()
  }
  
  // ============ 6. ПРОВЕРКА СТРАНИЦЫ БРОНИРОВАНИЯ (явно) ============
  // Дополнительная явная проверка для страницы бронирования
  if (pathname === '/booking' || pathname.startsWith('/booking?')) {
    if (!isAuthenticated) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', '/booking')
      return NextResponse.redirect(redirectUrl)
    }
    return NextResponse.next()
  }
  
  // ============ 7. ПРОВЕРКА API ЗАКАЗОВ И БРОНИРОВАНИЙ ============
  // POST запросы к API бронирований
  if (pathname === '/api/bookings' && request.method === 'POST') {
    if (!isAuthenticated) {
      return new NextResponse(
        JSON.stringify({ error: 'Для бронирования столика необходимо войти в аккаунт' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
    return NextResponse.next()
  }
  
  // POST запросы к API заказов
  if (pathname === '/api/orders' && request.method === 'POST') {
    if (!isAuthenticated) {
      return new NextResponse(
        JSON.stringify({ error: 'Для оформления заказа необходимо войти в аккаунт' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
    return NextResponse.next()
  }
  
  // ============ 8. ПРОВЕРКА РОЛЕЙ ДЛЯ API ============
  if (isApiPath(pathname)) {
    if (!isAuthenticated) {
      return new NextResponse(
        JSON.stringify({ error: 'Не авторизован' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    const role = await getUserRole(token)
    
    if (matchesPath(pathname, MANAGER_PATHS)) {
      if (role !== 'MANAGER' && role !== 'ADMIN') {
        return new NextResponse(
          JSON.stringify({ error: 'Доступ запрещен. Требуются права менеджера' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return NextResponse.next()
    }
    
    if (matchesPath(pathname, ADMIN_PATHS)) {
      if (role !== 'ADMIN') {
        return new NextResponse(
          JSON.stringify({ error: 'Доступ запрещен. Требуются права администратора' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return NextResponse.next()
    }
    
    return NextResponse.next()
  }
  
  // ============ 9. ПРОВЕРКА РОЛЕЙ ДЛЯ СТРАНИЦ ============
  if (matchesPath(pathname, MANAGER_PATHS)) {
    if (!isAuthenticated) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    const role = await getUserRole(token)
    if (role !== 'MANAGER' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }
  
  if (matchesPath(pathname, ADMIN_PATHS)) {
    if (!isAuthenticated) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    const role = await getUserRole(token)
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }
  
  // ============ 10. ПРОФИЛИ ПОЛЬЗОВАТЕЛЕЙ (публичные) ============
  if (pathname.match(/^\/profile\/[^\/]+$/) && !pathname.startsWith('/profile/me')) {
    return NextResponse.next()
  }
  
  if (pathname === '/profile' || pathname.startsWith('/profile/me')) {
    if (!isAuthenticated) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    return NextResponse.next()
  }
  
  // ============ 11. ПО УМОЛЧАНИЮ ============
  if (!isAuthenticated) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|images|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.webp).*)',
  ],
}