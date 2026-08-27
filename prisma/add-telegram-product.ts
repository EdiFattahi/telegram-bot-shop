import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({
  url: 'file:./dev.db',
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🚀 شروع اضافه کردن محصول ربات تلگرام...')

  const product = await prisma.product.upsert({
    where: { slug: 'telegram-order-bot' },
    update: {
      title: 'ربات سفارش‌گیر تلگرام',
      description: 'ربات هوشمند تلگرام برای مدیریت خودکار سفارشات، پرداخت‌ها و ارتباط با مشتریان',
      shortDesc: 'مدیریت خودکار سفارشات تلگرام با قابلیت پرداخت آنلاین',
      priceBase: 2900000,
      pricePro: 5900000,
      priceOrg: 12900000,
      features: JSON.stringify([
        'ثبت سفارش خودکار',
        'مدیریت محصولات',
        'گزارش فروش',
        'پرداخت آنلاین',
        'پشتیبانی ۲۴/۷'
      ]),
      demoUrl: 'https://t.me/YOUR_BOT_USERNAME',
      imageUrl: '/images/telegram-bot.jpg',
      status: 'active',
    },
    create: {
      slug: 'telegram-order-bot',
      title: 'ربات سفارش‌گیر تلگرام',
      description: 'ربات هوشمند تلگرام برای مدیریت خودکار سفارشات، پرداخت‌ها و ارتباط با مشتریان',
      shortDesc: 'مدیریت خودکار سفارشات تلگرام با قابلیت پرداخت آنلاین',
      priceBase: 2900000,
      pricePro: 5900000,
      priceOrg: 12900000,
      features: JSON.stringify([
        'ثبت سفارش خودکار',
        'مدیریت محصولات',
        'گزارش فروش',
        'پرداخت آنلاین',
        'پشتیبانی ۲۴/۷'
      ]),
      demoUrl: 'https://t.me/YOUR_BOT_USERNAME',
      imageUrl: '/images/telegram-bot.jpg',
      status: 'active',
    }
  })

  console.log('✅ محصول ربات تلگرام اضافه شد:', product.title)
  console.log('💰 قیمت پایه:', product.priceBase.toLocaleString('fa-IR'), 'تومان')
}

main()
  .catch((e) => {
    console.error('❌ خطا:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })