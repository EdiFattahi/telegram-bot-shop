import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({
  url: 'file:./dev.db',
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🔄 به‌روزرسانی آدرس ربات تلگرام...')

  const product = await prisma.product.update({
    where: { slug: 'telegram-order-bot' },
    data: {
      demoUrl: 'https://t.me/baby_gate_bot',
    }
  })

  console.log('✅ آدرس ربات به‌روزرسانی شد:', product.demoUrl)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())