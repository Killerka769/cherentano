import { prisma } from '@/lib/prisma'

export const BOOKING_BUFFER_MINUTES = 15

export type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

export type ConflictingBooking = {
  id: string
  time: string
  endTime: string | null
  customerName: string
}

export class BookingConflictError extends Error {
  status = 409 as const
  conflictingBookings: ConflictingBooking[]

  constructor(message: string, conflictingBookings: ConflictingBooking[] = []) {
    super(message)
    this.name = 'BookingConflictError'
    this.conflictingBookings = conflictingBookings
  }
}

export class BookingValidationError extends Error {
  status = 400 as const

  constructor(message: string) {
    super(message)
    this.name = 'BookingValidationError'
  }
}

export function addHours(time: string, hours: number): string {
  return addMinutes(time, hours * 60)
}

export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const totalMinutes = h * 60 + m + minutes
  const newH = Math.floor(totalMinutes / 60)
  const newM = ((totalMinutes % 60) + 60) % 60
  const normalizedH = newH < 0 ? 0 : newH
  return `${String(normalizedH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

/** Локальная полночь календарного дня, без мутации исходной даты. */
export function getBookingDateStart(dateInput: string | Date): Date {
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    const [year, month, day] = dateInput.slice(0, 10).split('-').map(Number)
    return new Date(year, month - 1, day, 0, 0, 0, 0)
  }

  const date = new Date(dateInput)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

export function getDayRange(dateInput: string | Date): { start: Date; end: Date } {
  const start = getBookingDateStart(dateInput)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

export function getNoShowTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number)
  const noShowTime = new Date(date)
  noShowTime.setHours(hours + 1, minutes, 0, 0)
  return noShowTime
}

export function isBookingDateTimeInPast(date: Date, time: string): boolean {
  const [hours, minutes] = time.split(':').map(Number)
  const bookingAt = new Date(date)
  bookingAt.setHours(hours, minutes, 0, 0)
  return bookingAt < new Date()
}

/** Пересечение слотов с буфером 15 минут вокруг новой брони. */
export function isTimeOverlap(
  newStart: string,
  newEnd: string,
  existingStart: string,
  existingEnd: string | null
): boolean {
  const existingEndTime = existingEnd || addHours(existingStart, 2)
  const newStartWithBuffer = addMinutes(newStart, -BOOKING_BUFFER_MINUTES)
  const newEndWithBuffer = addMinutes(newEnd, BOOKING_BUFFER_MINUTES)

  return (
    (newStartWithBuffer >= existingStart && newStartWithBuffer < existingEndTime) ||
    (newEndWithBuffer > existingStart && newEndWithBuffer <= existingEndTime) ||
    (newStartWithBuffer <= existingStart && newEndWithBuffer >= existingEndTime) ||
    (newStartWithBuffer >= existingStart && newEndWithBuffer <= existingEndTime)
  )
}

export async function findConflictingBookings(
  tx: TxClient,
  tableId: number,
  date: Date,
  time: string,
  endTime: string,
  excludeBookingId?: string
): Promise<ConflictingBooking[]> {
  const { start, end } = getDayRange(date)

  const existingBookings = await tx.booking.findMany({
    where: {
      tableId,
      date: { gte: start, lt: end },
      status: { in: ['CONFIRMED', 'PENDING'] },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    select: {
      id: true,
      time: true,
      endTime: true,
      customerName: true,
    },
  })

  return existingBookings.filter((booking) => {
    const bookingEnd = booking.endTime || addHours(booking.time, 2)
    return isTimeOverlap(time, endTime, booking.time, bookingEnd)
  })
}

/**
 * Блокирует кабинку (FOR UPDATE), проверяет вместимость и занятость
 * с 15-минутным буфером. Вызывать только внутри транзакции.
 */
export async function assertCabinAvailable(
  tx: TxClient,
  params: {
    tableId: number
    date: Date
    time: string
    endTime: string
    guests?: number
    excludeBookingId?: string
  }
) {
  const { tableId, date, time, endTime, guests, excludeBookingId } = params

  const locked = await tx.$queryRaw<{ id: number }[]>`
    SELECT id FROM "Table" WHERE id = ${tableId} FOR UPDATE
  `

  if (!locked.length) {
    throw new BookingValidationError('Выбранный столик не найден')
  }

  const table = await tx.table.findUnique({ where: { id: tableId } })

  if (!table) {
    throw new BookingValidationError('Выбранный столик не найден')
  }

  if (!table.isActive) {
    throw new BookingValidationError('Выбранный столик временно недоступен')
  }

  if (guests && table.seats < guests) {
    throw new BookingValidationError(
      `В кабинке ${table.seats} мест, а вы выбрали ${guests} гостей`
    )
  }

  const conflictingBookings = await findConflictingBookings(
    tx,
    tableId,
    date,
    time,
    endTime,
    excludeBookingId
  )

  if (conflictingBookings.length > 0) {
    const first = conflictingBookings[0]
    throw new BookingConflictError(
      `Кабинка занята в это время (учитывается ${BOOKING_BUFFER_MINUTES}-минутный перерыв). Бронь: ${first.customerName} (${first.time}${first.endTime ? ` - ${first.endTime}` : ''})`,
      conflictingBookings
    )
  }

  return table
}
