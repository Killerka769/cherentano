import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Начинаем синхронизацию существующих благотворительных заказов...')
  
  // Находим все благотворительные заказы со статусом COMPLETED
  const charityOrders = await prisma.order.findMany({
    where: {
      isCharity: true,
      status: 'COMPLETED'
    },
    include: {
      items: true,
      user: true
    }
  })
  
  console.log(`📦 Найдено ${charityOrders.length} благотворительных заказов`)
  
  let created = 0
  let skipped = 0
  
  for (const order of charityOrders) {
    // Ищем связанную заявку
    const helpRequest = await prisma.helpRequest.findFirst({
      where: { orderId: order.id }
    })
    
    if (helpRequest) {
      // Проверяем, есть ли история
      const existingHistory = await prisma.helpHistory.findFirst({
        where: { helpRequestId: helpRequest.id }
      })
      
      if (!existingHistory) {
        // Создаём историю
        await prisma.helpHistory.create({
          data: {
            helpRequestId: helpRequest.id,
            beneficiaryId: helpRequest.beneficiaryId,
            userId: order.userId,
            mealTime: helpRequest.mealTime || 'LUNCH',
            amount: order.total,
            items: order.items.map((item: any) => ({
              name: item.dishName,
              quantity: item.quantity,
              price: item.price
            })),
            comment: `Заказ #${order.id} (синхронизирован)`
          }
        })
        created++
        console.log(`✅ Создана история для заказа #${order.id}`)
      } else {
        skipped++
      }
    }
  }
  
  console.log(`✅ Синхронизация завершена! Создано: ${created}, Пропущено: ${skipped}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())