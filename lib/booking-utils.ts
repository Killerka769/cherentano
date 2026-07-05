interface BookingCheck {
    tableId: number;
    date: Date;
    time: string;
    endTime: string;
    bookingId?: string; // для исключения себя при обновлении
  }
  
  interface ExistingBooking {
    id: string;
    tableId: number;
    date: Date;
    time: string;
    endTime: string | null;
    status: string;
  }
  
  export function isTimeOverlap(
    newStart: string,
    newEnd: string,
    existingStart: string,
    existingEnd: string | null
  ): boolean {
    // Если у существующей брони нет endTime - считаем что она длится 2 часа
    const existingEndTime = existingEnd || addHours(existingStart, 2);
    
    // Проверка на пересечение:
    // Новая бронь начинается внутри существующей
    const startsInside = newStart >= existingStart && newStart < existingEndTime;
    // Новая бронь заканчивается внутри существующей
    const endsInside = newEnd > existingStart && newEnd <= existingEndTime;
    // Новая бронь полностью перекрывает существующую
    const covers = newStart <= existingStart && newEnd >= existingEndTime;
    // Новая бронь внутри существующей
    const inside = newStart >= existingStart && newEnd <= existingEndTime;
    
    return startsInside || endsInside || covers || inside;
  }
  
  function addHours(time: string, hours: number): string {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + hours * 60;
    const newH = Math.floor(totalMinutes / 60);
    const newM = totalMinutes % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  }
  
  export async function checkBookingConflict(
    tableId: number,
    date: Date,
    time: string,
    endTime: string,
    excludeBookingId?: string
  ): Promise<{ hasConflict: boolean; conflictingBookings: ExistingBooking[] }> {
    // Получаем все брони на этот столик и дату
    const { prisma } = await import('@/lib/prisma');
    
    const existingBookings = await prisma.booking.findMany({
      where: {
        tableId,
        date: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999))
        },
        status: { in: ['CONFIRMED', 'PENDING'] },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {})
      }
    });
    
    const conflicting = existingBookings.filter(booking => {
      // Если у существующей брони нет endTime - используем time + 2 часа
      const bookingEnd = booking.endTime || addHours(booking.time, 2);
      
      return isTimeOverlap(time, endTime, booking.time, bookingEnd);
    });
    
    return {
      hasConflict: conflicting.length > 0,
      conflictingBookings: conflicting
    };
  }