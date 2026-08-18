import { PrismaClient } from '@prisma/client'
import { prisma } from '../lib/prisma'  // تغییر دادم به lib/prisma

async function main() {
  // محصولات نمونه
  await prisma.product.createMany({
    data: [
      {
        slug: 'rabot-sarkhor-gir',
        title: 'ربات سفارشگیر تلگرام',
        description: 'سفارشات را کاملاً خودکار ثبت، مدیریت و پرداخت کنید',
        shortDesc: 'ثبت سفارش خودکار • مدیریت محصولات • گزارش فروش • پرداخت خودکار',
        priceBase: 2000000,
        pricePro: 5000000,
        priceOrg: 10000000,
        features: [
          'ثبت سفارش خودکار از همه کانال‌ها',
          'مدیریت کامل محصولات',
          'گزارش فروش لحظه‌ای',
          'پرداخت خودکار',
          'پیام به مشتری',
          'جداول و داشبورد'
        ],
        demoUrl: 'https://demo.yourdomain.ir',
        imageUrl: '/images/robot-telegram.jpg',
        status: 'active',
      },
      {
        slug: 'automate-adaf',
        title: 'اتوماسیون اداری',
        description: 'بهزودی… مدیریت کامل دفترخانه و فرآیندهای اداری',
        shortDesc: 'به زودی در دسترس',
        priceBase: 0,
        pricePro: 0,
        priceOrg: 0,
        features: [],
        demoUrl: null,
        imageUrl: '/images/automation-admin.jpg',
        status: 'coming-soon',
      },
    ]
  })

  // نظرات نمونه
  await prisma.testimonial.createMany({
    data: [
      {
        name: 'مهدی رضایی',
        role: 'صاحب فروشگاه آنلاین',
        content: 'ربات سفارشگیر تلگرام از روز اول زندگی فروش من را تغییر داد. دیگر هیچ سفارشی گم نمی‌شود!',
        avatar: 'https://picsum.photos/id/64/150/150',
      },
      {
        name: 'سارا احمدی',
        role: 'تاجر آنلاین',
        content: 'قیمت مناسب + پشتیبانی عالی + راه‌اندازی در ۴۸ ساعت. بهترین تصمیم زندگی من بود.',
        avatar: 'https://picsum.photos/id/91/150/150',
      },
    ]
  })

  console.log('✅ Seed کامل شد!')
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())