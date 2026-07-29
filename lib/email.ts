import nodemailer from 'nodemailer';

// Создаём транспорт для отправки писем через sendmail (Postfix)
const transporter = nodemailer.createTransport({
  sendmail: true,
  newline: 'unix',
  path: '/usr/sbin/sendmail',
});

// === ИНТЕРФЕЙСЫ ===

interface OrderItem {
  dishName: string;
  quantity: number;
  price: number;
}

interface OrderData {
  id: number;
  customerName: string;
  customerPhone: string;
  orderType: string;
  deliveryAddress?: string | null;
  total: number;
  items: OrderItem[];
  comment?: string | null;
  createdAt: Date | string;
  isCharity?: boolean;
}

interface BookingData {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  tableNumber: number;
  tableName: string | null;
  date: Date | string;
  time: string;
  guests: number;
  comment?: string | null;
}

// === ОТПРАВКА УВЕДОМЛЕНИЯ О ЗАКАЗЕ ===

export async function sendOrderNotification(order: OrderData) {
  const createdAtStr = order.createdAt instanceof Date 
    ? order.createdAt.toISOString() 
    : order.createdAt;

  const subject = order.isCharity 
    ? `❤️ Новый благотворительный заказ #${order.id}`
    : `🆕 Новый заказ #${order.id}`;

  const typeLabel = order.orderType === 'DELIVERY' ? '🚚 Доставка' : '🏠 Самовывоз';
  const charityLabel = order.isCharity ? ' (Благотворительность)' : '';

  const itemsList = order.items
    .map(i => `  • ${i.dishName} x${i.quantity} = ${i.price * i.quantity} ₽`)
    .join('\n');

  const deliveryAddress = order.deliveryAddress || undefined;
  const comment = order.comment || undefined;

  const text = `
${subject}

📋 Информация о заказе:
━━━━━━━━━━━━━━━━━━━━━

🆔 Заказ: #${order.id}
👤 Клиент: ${order.customerName}
📞 Телефон: ${order.customerPhone}
📦 Тип: ${typeLabel}${charityLabel}
${deliveryAddress ? `📍 Адрес: ${deliveryAddress}` : ''}
📅 Дата: ${new Date(createdAtStr).toLocaleString('ru-RU')}
💰 Сумма: ${order.total} ₽

📝 Состав заказа:
${itemsList}

${comment ? `💬 Комментарий: ${comment}` : ''}

━━━━━━━━━━━━━━━━━━━━━
🔗 Для обработки перейдите в панель менеджера:
https://chelentano05.ru/manager/orders
  `;

  const html = `
<h2>${subject}</h2>

<table style="width:100%; max-width:500px; border-collapse:collapse; font-family:Arial, sans-serif;">
  <tr><td style="padding:6px 0; border-bottom:1px solid #eee;"><strong>🆔 Заказ</strong></td><td style="padding:6px 0; border-bottom:1px solid #eee;">#${order.id}</td></tr>
  <tr><td style="padding:6px 0; border-bottom:1px solid #eee;"><strong>👤 Клиент</strong></td><td style="padding:6px 0; border-bottom:1px solid #eee;">${order.customerName}</td></tr>
  <tr><td style="padding:6px 0; border-bottom:1px solid #eee;"><strong>📞 Телефон</strong></td><td style="padding:6px 0; border-bottom:1px solid #eee;">${order.customerPhone}</td></tr>
  <tr><td style="padding:6px 0; border-bottom:1px solid #eee;"><strong>📦 Тип</strong></td><td style="padding:6px 0; border-bottom:1px solid #eee;">${typeLabel}${charityLabel}</td></tr>
  ${deliveryAddress ? `<tr><td style="padding:6px 0; border-bottom:1px solid #eee;"><strong>📍 Адрес</strong></td><td style="padding:6px 0; border-bottom:1px solid #eee;">${deliveryAddress}</td></tr>` : ''}
  <tr><td style="padding:6px 0; border-bottom:1px solid #eee;"><strong>💰 Сумма</strong></td><td style="padding:6px 0; border-bottom:1px solid #eee; font-weight:bold; color:#c4492c;">${order.total} ₽</td></tr>
</table>

<h3 style="margin-top:20px;">📝 Состав заказа</h3>
<ul style="list-style:none; padding:0;">
  ${order.items.map(i => `<li style="padding:4px 0; border-bottom:1px solid #f0f0f0;">• ${i.dishName} x${i.quantity} = ${i.price * i.quantity} ₽</li>`).join('')}
</ul>

${comment ? `<p><strong>💬 Комментарий:</strong> ${comment}</p>` : ''}

<hr style="margin:20px 0;">
<p style="color:#888; font-size:0.8rem;">
  🔗 <a href="https://chelentano05.ru/manager/orders" style="color:#c4492c;">Перейти в панель менеджера</a>
</p>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Ресторан Челентано" <orders@chelentano05.ru>`,
      to: process.env.MANAGER_EMAIL || 'mr.celentano05@mail.ru',
      subject,
      text,
      html,
    });
    console.log('✅ Email отправлен:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Ошибка отправки email:', error);
    return { success: false, error };
  }
}

// === ОТПРАВКА УВЕДОМЛЕНИЯ О БРОНИРОВАНИИ ===

export async function sendBookingNotification(booking: BookingData) {
  const dateStr = booking.date instanceof Date 
    ? booking.date.toISOString().split('T')[0] 
    : booking.date;

  const subject = `🪑 Новое бронирование #${booking.id}`;

  const email = booking.customerEmail || undefined;
  const comment = booking.comment || undefined;

  const text = `
${subject}

📋 Информация о бронировании:
━━━━━━━━━━━━━━━━━━━━━

🆔 Бронь: #${booking.id}
👤 Клиент: ${booking.customerName}
📞 Телефон: ${booking.customerPhone}
${email ? `📧 Email: ${email}` : ''}
🪑 Столик: №${booking.tableNumber} ${booking.tableName ? `(${booking.tableName})` : ''}
📅 Дата: ${dateStr}
⏰ Время: ${booking.time}
👥 Гостей: ${booking.guests}
${comment ? `💬 Комментарий: ${comment}` : ''}

━━━━━━━━━━━━━━━━━━━━━
🔗 Для обработки перейдите в панель менеджера:
https://chelentano05.ru/manager/bookings
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Ресторан Челентано" <orders@chelentano05.ru>`,
      to: process.env.MANAGER_EMAIL || 'mr.celentano05@mail.ru',
      subject,
      text,
    });
    console.log('✅ Email о бронировании отправлен:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Ошибка отправки email о бронировании:', error);
    return { success: false, error };
  }
}