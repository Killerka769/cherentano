import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// ============ КОНФИГУРАЦИЯ МАРШРУТОВ ============

// Абсолютно публичные (даже для забаненных)
const ABSOLUTELY_PUBLIC = [
  '/login',
  '/register',
  '/blocked',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/block-info',
  '/api/auth/check-block',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
]

// Публичные страницы (доступны всем, но забаненным показываем бан)
const PUBLIC_PAGES = [
  '/',
  '/menu',
  '/menu/',
  '/blog',
  '/blog/',
  '/reviews',
  '/contacts',
  '/about',
  '/privacy',
  '/delivery',
  '/cart',
]

// Публичные API (доступны всем, но забаненным блокируем)
const PUBLIC_API = [
  '/api/dishes',
  '/api/dishes/',
  '/api/categories',
  '/api/reviews',
  '/api/blog/posts',
  '/api/blog/posts/',
  '/api/blog/comments',
  '/api/user/',
  '/api/tables',
]

// Страницы только для гостей (редирект на главную если уже авторизован)
const GUEST_ONLY = [
  '/login',
  '/register',
]

// Защищенные страницы (только для авторизованных)
const PROTECTED_PAGES = [
  '/profile',
  '/profile/',
  '/checkout',
  '/booking',
  '/booking/',
  '/recipes',
  '/recipes/',
  '/charity',
  '/charity/',
  '/charity/history',
  '/favorites',
  '/saved-carts',
]

// Защищенные API (только для авторизованных)
const PROTECTED_API = [
  '/api/orders',
  '/api/orders/',
  '/api/bookings',
  '/api/bookings/',
  '/api/favorites',
  '/api/saved-carts',
  '/api/user/update',
  '/api/user/birthdate',
  '/api/user/birthday-discount',
  '/api/charity',
  '/api/charity/',
  '/api/charity/requests',
  '/api/charity/requests/',
  '/api/charity/history',
]

// Страницы менеджера
const MANAGER_PAGES = [
  '/manager',
  '/manager/',
]

// API менеджера
const MANAGER_API = [
  '/api/manager/',
]

// Страницы админа
const ADMIN_PAGES = [
  '/admin',
  '/admin/',
]

// API админа
const ADMIN_API = [
  '/api/admin/',
]

// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============

function matchesPath(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    if (pattern.endsWith('/')) {
      return pathname.startsWith(pattern)
    }
    return pathname === pattern || pathname.startsWith(pattern + '/')
  })
}

function isAbsolutelyPublic(pathname: string): boolean {
  return matchesPath(pathname, ABSOLUTELY_PUBLIC)
}

function isGuestOnly(pathname: string): boolean {
  return matchesPath(pathname, GUEST_ONLY)
}

function isPublicPage(pathname: string): boolean {
  return matchesPath(pathname, PUBLIC_PAGES)
}

function isPublicApi(pathname: string): boolean {
  return matchesPath(pathname, PUBLIC_API)
}

function isProtectedPage(pathname: string): boolean {
  return matchesPath(pathname, PROTECTED_PAGES)
}

function isProtectedApi(pathname: string): boolean {
  return matchesPath(pathname, PROTECTED_API)
}

function isManagerPage(pathname: string): boolean {
  return matchesPath(pathname, MANAGER_PAGES)
}

function isManagerApi(pathname: string): boolean {
  return matchesPath(pathname, MANAGER_API)
}

function isAdminPage(pathname: string): boolean {
  return matchesPath(pathname, ADMIN_PAGES)
}

function isAdminApi(pathname: string): boolean {
  return matchesPath(pathname, ADMIN_API)
}

function isApiPath(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

async function verifyToken(token: string): Promise<{ userId: string; role: string } | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    return { userId: payload.userId as string, role: payload.role as string }
  } catch {
    return null
  }
}

// ============ ОСНОВНАЯ ФУНКЦИЯ MIDDLEWARE ============

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // ============ 1. АБСОЛЮТНО ПУБЛИЧНЫЕ МАРШРУТЫ ============
  if (isAbsolutelyPublic(pathname)) {
    return NextResponse.next()
  }
  
  // ============ 2. ПОЛУЧАЕМ ТОКЕН ============
  const token = request.cookies.get('token')?.value
  const isAuthenticated = !!token
  
  // ============ 3. ЕСЛИ НЕТ ТОКЕНА ============
  if (!isAuthenticated) {
    // Публичные страницы и API - пропускаем
    if (isPublicPage(pathname) || isPublicApi(pathname)) {
      return NextResponse.next()
    }
    // Гостевые страницы (логин/регистрация) - пропускаем
    if (isGuestOnly(pathname)) {
      return NextResponse.next()
    }
    // Защищенные страницы - редирект на логин
    if (isProtectedPage(pathname) || isProtectedApi(pathname)) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    // Менеджер/Админ - редирект на логин
    if (isManagerPage(pathname) || isManagerApi(pathname) || 
        isAdminPage(pathname) || isAdminApi(pathname)) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    return NextResponse.next()
  }
  
  // ============ 4. ПРОВЕРЯЕМ ВАЛИДНОСТЬ ТОКЕНА ============
  const decoded = await verifyToken(token)
  
  if (!decoded) {
    // Невалидный токен - удаляем и редирект на логин
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('token')
    return response
  }
  
  const { userId, role } = decoded
  
  // ============ 5. ГОСТЕВЫЕ СТРАНИЦЫ ДЛЯ АВТОРИЗОВАННЫХ ============
  // Если пользователь уже авторизован и пытается зайти на логин/регистрацию
  if (isGuestOnly(pathname)) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  // ============ 6. ПРОВЕРКА БЛОКИРОВКИ ============
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const blockResponse = await fetch(`${baseUrl}/api/auth/check-block?userId=${userId}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
    
    if (blockResponse.ok) {
      const data = await blockResponse.json()
      
      if (data.isBlocked) {
        // Если заблокирован и не на странице блокировки
        if (pathname !== '/blocked') {
          return NextResponse.redirect(new URL('/blocked', request.url))
        }
        return NextResponse.next()
      }
    }
  } catch (error) {
    console.error('Error checking block:', error)
  }
  
  // ============ 7. ПРОВЕРКА РОЛЕЙ - МЕНЕДЖЕР ============
  if (isManagerPage(pathname) || isManagerApi(pathname)) {
    if (role !== 'MANAGER' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }
  
  // ============ 8. ПРОВЕРКА РОЛЕЙ - АДМИН ============
  if (isAdminPage(pathname) || isAdminApi(pathname)) {
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }
  
  // ============ 9. ЗАЩИЩЕННЫЕ СТРАНИЦЫ И API ============
  if (isProtectedPage(pathname) || isProtectedApi(pathname)) {
    return NextResponse.next()
  }
  
  // ============ 10. ПУБЛИЧНЫЕ СТРАНИЦЫ ДЛЯ АВТОРИЗОВАННЫХ ============
  if (isPublicPage(pathname) || isPublicApi(pathname)) {
    return NextResponse.next()
  }
  
  // ============ 11. ПО УМОЛЧАНИЮ ============
  return NextResponse.next()
}

// ============ КОНФИГУРАЦИЯ MATCHER ============
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - images folder
     * - .svg, .png, .jpg, .jpeg, .webp (image files)
     * - robots.txt, sitemap.xml
     */
    '/((?!_next/static|_next/image|favicon.ico|public|images|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.webp|robots.txt|sitemap.xml).*)',
  ],
}