import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'

const adapter = new PrismaBetterSqlite3({
  url: 'file:./dev.db',
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🚀 شروع seed...')

  // پاک کردن داده‌های قبلی
  console.log('🧹 پاک کردن داده‌های قبلی...')
  await prisma.order.deleteMany()
  await prisma.testimonial.deleteMany()
  await prisma.product.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ داده‌های قبلی پاک شدند')

  // ایجاد کاربر ادمین با پسورد hash شده
  console.log('👤 ایجاد کاربر ادمین...')
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword, // پسورد hash شده
      name: 'مدیر سیستم',
      role: 'ADMIN',
    },
  })
  console.log('✅ کاربر ادمین ایجاد شد:', adminUser.email)
  console.log('🔑 پسورد: admin123')

  // ایجاد محصولات
  console.log('📦 ایجاد محصولات...')
  const products = await prisma.product.createMany({
    data: [
      {
        slug: 'telegram-order-bot',
        title: 'ربات سفارش‌گیر تلگرام',
        description: 'ربات هوشمند تلگرام برای مدیریت خودکار سفارشات، پرداخت‌ها و ارتباط با مشتریان. این ربات تمام فرآیند فروش شما را اتوماتیک می‌کند.',
        shortDesc: 'مدیریت خودکار سفارشات تلگرام با قابلیت پرداخت آنلاین',
        priceBase: 2900000,
        pricePro: 5900000,
        priceOrg: 12900000,
        features: JSON.stringify([
          'ثبت سفارش خودکار از کانال تلگرام',
          'اتصال به درگاه پرداخت',
          'مدیریت محصولات و قیمت‌ها',
          'گزارش فروش روزانه و ماهانه',
          'ارسال پیام خودکار به مشتریان',
          'پنل مدیریت اختصاصی',
          'پشتیبانی از چند ادمین',
          'خروجی اکسل از سفارشات'
        ]),
        demoUrl: 'https://t.me/your_demo_bot',
        imageUrl: '/images/telegram-bot.jpg',
        status: 'active',
      },
      {
        slug: 'office-automation',
        title: 'اتوماسیون اداری',
        description: 'سیستم جامع مدیریت فرآیندهای اداری، دبیرخانه و گردش کار. مناسب برای سازمان‌ها و شرکت‌های متوسط و بزرگ.',
        shortDesc: 'مدیریت هوشمند فرآیندهای اداری و دبیرخانه',
        priceBase: 9900000,
        pricePro: 19900000,
        priceOrg: 39900000,
        features: JSON.stringify([
          'مدیریت مکاتبات اداری',
          'گردش کار و تاییدیه‌ها',
          'آرشیو الکترونیک اسناد',
          'یادآوری و اعلان‌ها',
          'گزارش‌گیری پیشرفته',
          'مدیریت کاربران و دسترسی‌ها'
        ]),
        demoUrl: null,
        imageUrl: '/images/automation.jpg',
        status: 'coming-soon',
      },
      {
        slug: 'ai-consulting',
        title: 'مشاوره هوش مصنوعی',
        description: 'خدمات مشاوره و پیاده‌سازی راهکارهای هوش مصنوعی برای کسب‌وکارها. از تحلیل نیازمندی تا پیاده‌سازی کامل.',
        shortDesc: 'مشاوره تخصصی پیاده‌سازی AI در کسب‌وکار',
        priceBase: 4900000,
        pricePro: 9900000,
        priceOrg: 19900000,
        features: JSON.stringify([
          'تحلیل نیازمندی‌ها',
          'طراحی راهکار AI',
          'پیاده‌سازی و آموزش',
          'پشتیبانی فنی',
          'بهینه‌سازی مدل‌ها'
        ]),
        demoUrl: null,
        imageUrl: '/images/ai-consulting.jpg',
        status: 'active',
      },
      {
        slug: 'website-design',
        title: 'طراحی سایت اختصاصی',
        description: 'طراحی و توسعه وب‌سایت‌های مدرن و واکنش‌گرا با استفاده از جدیدترین تکنولوژی‌ها.',
        shortDesc: 'طراحی سایت مدرن با React/Next.js',
        priceBase: 7900000,
        pricePro: 14900000,
        priceOrg: 29900000,
        features: JSON.stringify([
          'طراحی UI/UX اختصاصی',
          'واکنش‌گرا (موبایل و دسکتاپ)',
          'بهینه‌سازی SEO',
          'سرعت بارگذاری بالا',
          'پنل مدیریت محتوا',
          'امنیت بالا'
        ]),
        demoUrl: null,
        imageUrl: '/images/web-design.jpg',
        status: 'active',
      },
    ],
  })
  console.log(`✅ ${products.count} محصول ایجاد شد`)

  // ایجاد نظرات
  console.log('💬 ایجاد نظرات مشتریان...')
  const testimonials = await prisma.testimonial.createMany({
    data: [
      {
        name: 'مهدی رضایی',
        role: 'مدیر فروشگاه آنلاین',
        content: 'ربات سفارش‌گیر تلگرام فوق‌العاده است! در ماه اول ۴۰٪ افزایش فروش داشتم. پشتیبانی هم عالیه.',
        avatar: '/images/testimonials/user1.jpg',
      },
      {
        name: 'سارا احمدی',
        role: 'کارآفرین',
        content: 'پشتیبانی عالی و راه‌اندازی سریع. دقیقاً همون چیزی بود که نیاز داشتم. قیمت هم منصفانه است.',
        avatar: '/images/testimonials/user2.jpg',
      },
      {
        name: 'علی محمدی',
        role: 'مدیر دیجیتال مارکتینگ',
        content: 'بهترین سرمایه‌گذاری برای کسب‌وکارم. اتوماسیون کامل و بدون خطا. گزارش‌گیری عالی داره.',
        avatar: '/images/testimonials/user3.jpg',
      },
    ],
  })
  console.log(`✅ ${testimonials.count} نظر مشتری ایجاد شد`)

  console.log('🎉 Seed با موفقیت کامل شد!')
}

main()
  .catch((e) => {
    console.error('❌ خطا در اجرای seed:')
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })