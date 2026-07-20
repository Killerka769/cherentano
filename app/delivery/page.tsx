import DeliveryClient from './DeliveryClient';
import { prisma } from '@/lib/prisma';

// Получаем настройки на сервере
async function getSettings() {
  const settings = await prisma.settings.findFirst({
    select: {
      phone: true,
      email: true,
      address: true,
      deliveryMinSum: true,
      deliveryPrice: true,
      workDays: true,
    }
  });
  
  return settings;
}

export default async function DeliveryPage() {
  const settings = await getSettings();
  
  // Сериализуем данные для клиента
  const serializedSettings = settings ? {
    phone: settings.phone,
    email: settings.email,
    address: settings.address,
    deliveryMinSum: settings.deliveryMinSum,
    deliveryPrice: settings.deliveryPrice,
    workDays: typeof settings.workDays === 'string' 
      ? JSON.parse(settings.workDays) 
      : settings.workDays,
  } : null;

  return <DeliveryClient initialSettings={serializedSettings} />;
}