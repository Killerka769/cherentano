import { NextRequest, NextResponse } from 'next/server'

/**
 * Простой rate limit «N запросов с одного IP за минуту».
 *
 * Зачем: бот с Hetzner за минуты насоздавал аккаунты и заказы через
 * /api/auth/register, /api/auth/login и /api/orders. Этот модуль режет
 * частоту с одного IP, чтобы такой прогон упирался в 429.
 *
 * Как работает (фиксированное окно 60 секунд):
 * 1. Берём IP клиента (за nginx это X-Forwarded-For / X-Real-IP).
 * 2. Смотрим, к какой группе относится путь (register / login / orders).
 * 3. Ключ хранилища = «IP + группа». Все запросы одной группы делят лимит.
 * 4. В Map лежит счётчик и время начала окна.
 * 5. Пока окно не истекло — каждый запрос увеличивает счётчик.
 * 6. Если счётчик > N — отвечаем 429 и заголовок Retry-After.
 * 7. Когда минута прошла — окно сбрасывается, счётчик снова с 1.
 *
 * Это in-memory (Map в процессе Node/PM2). После рестарта счётчики
 * обнуляются. Несколько воркеров PM2 считают отдельно — для простой
 * защиты от массового спама этого достаточно, Redis не нужен.
 */

const WINDOW_MS = 60_000

// N запросов в минуту на группу. Меняйте здесь, не в роутах.
const LIMITS = {
  register: 4, // регистрация: мало, чтобы не плодить фейковые аккаунты
  login: 10, // логин: чуть больше, но брутфорс быстро упрётся в 429
  orders: 10, // создание/чтение заказов с одного IP
} as const

type LimitGroup = keyof typeof LIMITS

type Bucket = {
  count: number
  windowStart: number
}

const buckets = new Map<string, Bucket>()

function getClientIp(request: NextRequest): string {
  // Nginx обычно пишет реальный IP в эти заголовки.
  // Берём первый адрес из X-Forwarded-For: «клиент, прокси, прокси».
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }

  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  return 'unknown'
}

function getLimitGroup(pathname: string): LimitGroup | null {
  if (pathname === '/api/auth/register' || pathname.startsWith('/api/auth/register/')) {
    return 'register'
  }
  if (pathname === '/api/auth/login' || pathname.startsWith('/api/auth/login/')) {
    return 'login'
  }
  // /api/orders и всё ниже (/api/orders/payment и т.д.) — одна группа
  if (pathname === '/api/orders' || pathname.startsWith('/api/orders/')) {
    return 'orders'
  }
  return null
}

function pruneExpired(now: number) {
  // Чтобы Map не рос бесконечно на уникальных IP сканеров
  if (buckets.size < 2000) return
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart >= WINDOW_MS) {
      buckets.delete(key)
    }
  }
}

/**
 * Если путь лимитируется и IP превысил N — вернёт ответ 429.
 * Если всё ок (или путь не из списка) — вернёт null, middleware пускает дальше.
 */
export function checkRateLimit(request: NextRequest): NextResponse | null {
  const group = getLimitGroup(request.nextUrl.pathname)
  if (!group) return null

  const max = LIMITS[group]
  const ip = getClientIp(request)
  const key = `${ip}:${group}`
  const now = Date.now()

  pruneExpired(now)

  let bucket = buckets.get(key)

  // Новое окно: либо IP первый раз, либо минута уже прошла
  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now })
    return null
  }

  bucket.count += 1

  if (bucket.count <= max) {
    return null
  }

  const retryAfterSec = Math.max(
    1,
    Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000)
  )

  return NextResponse.json(
    { error: 'Слишком много запросов. Попробуйте через минуту.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSec),
        'X-RateLimit-Limit': String(max),
        'X-RateLimit-Remaining': '0',
      },
    }
  )
}
