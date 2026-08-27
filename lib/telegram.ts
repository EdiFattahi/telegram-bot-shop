import { Telegraf, Context } from 'telegraf'
import { prisma } from './prisma'
import { HttpsProxyAgent } from 'https-proxy-agent'

interface BotSession {
  waitingForProduct?: boolean
}

interface BotContext extends Context {
  session?: BotSession
}

// استفاده از پروکسی تلگرام دسکتاپ
const proxyUrl = process.env.TELEGRAM_PROXY_URL || 'http://127.0.0.1:10530'
const proxyAgent = new HttpsProxyAgent(proxyUrl)

const bot = new Telegraf<BotContext>(process.env.TELEGRAM_BOT_TOKEN || '', {
  telegram: {
    agent: proxyAgent
  }
})

// دستور شروع
bot.start(async (ctx) => {
  const userName = ctx.from?.first_name || 'کاربر'
  await ctx.reply(
    `سلام ${userName} عزیز! 👋\n\n` +
    `به ربات سفارش‌گیر خوش آمدید.\n\n` +
    `📋 برای ثبت سفارش از دستور /order استفاده کنید\n` +
    `📦 برای مشاهده محصولات از دستور /products استفاده کنید\n` +
    `❓ برای راهنمایی از دستور /help استفاده کنید`
  )
})

// دستور راهنما
bot.command('help', async (ctx) => {
  await ctx.reply(
    `📚 راهنمای استفاده:\n\n` +
    `/start - شروع کار با ربات\n` +
    `/products - مشاهده محصولات\n` +
    `/order - ثبت سفارش جدید\n` +
    `/status - پیگیری وضعیت سفارش\n` +
    `/contact - تماس با پشتیبانی`
  )
})

// مشاهده محصولات
bot.command('products', async (ctx) => {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'active' },
      take: 10
    })

    if (products.length === 0) {
      await ctx.reply('❌ محصولی یافت نشد')
      return
    }

    let message = '📦 محصولات موجود:\n\n'
    products.forEach((product, index) => {
      message += `${index + 1}. ${product.title}\n`
      message += `   قیمت: ${product.priceBase.toLocaleString('fa-IR')} تومان\n`
      message += `   توضیح: ${product.shortDesc}\n\n`
    })

    message += '\nبرای سفارش از دستور /order استفاده کنید'

    await ctx.reply(message)
  } catch (error) {
    console.error('Error fetching products:', error)
    await ctx.reply('❌ خطا در دریافت محصولات')
  }
})

// ثبت سفارش
bot.command('order', async (ctx) => {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'active' }
    })

    if (products.length === 0) {
      await ctx.reply('❌ محصولی برای سفارش وجود ندارد')
      return
    }

    let message = '📝 برای ثبت سفارش، شماره محصول را وارد کنید:\n\n'
    products.forEach((product, index) => {
      message += `${index + 1}. ${product.title} - ${product.priceBase.toLocaleString('fa-IR')} تومان\n`
    })

    await ctx.reply(message)
    
    if (ctx.session) {
      ctx.session.waitingForProduct = true
    }
  } catch (error) {
    console.error('Error in order command:', error)
    await ctx.reply('❌ خطا در ثبت سفارش')
  }
})

// دریافت پیام متنی
bot.on('text', async (ctx) => {
  const text = ctx.message.text
  const userId = ctx.from?.id

  if (!userId) return

  if (ctx.session?.waitingForProduct) {
    const productIndex = parseInt(text) - 1
    
    try {
      const products = await prisma.product.findMany({
        where: { status: 'active' }
      })

      if (productIndex >= 0 && productIndex < products.length) {
        const selectedProduct = products[productIndex]
        
        const order = await prisma.order.create({
          data: {
            telegramId: userId.toString(),
            productId: selectedProduct.id,
            plan: 'پایه',
            amount: selectedProduct.priceBase,
            status: 'pending',
          }
        })

        await ctx.reply(
          `✅ سفارش شما ثبت شد!\n\n` +
          `📦 محصول: ${selectedProduct.title}\n` +
          `💰 مبلغ: ${selectedProduct.priceBase.toLocaleString('fa-IR')} تومان\n` +
          `🔢 شماره سفارش: ${order.id.slice(0, 8)}\n\n` +
          `برای پرداخت و تکمیل سفارش، لطفاً با پشتیبانی تماس بگیرید.\n` +
          `از دستور /contact استفاده کنید.`
        )

        if (ctx.session) {
          ctx.session.waitingForProduct = false
        }
      } else {
        await ctx.reply('❌ شماره نامعتبر است. لطفاً دوباره تلاش کنید')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      await ctx.reply('❌ خطا در ثبت سفارش')
    }
  }
})

// پیگیری وضعیت سفارش
bot.command('status', async (ctx) => {
  const userId = ctx.from?.id
  if (!userId) return

  try {
    const orders = await prisma.order.findMany({
      where: { telegramId: userId.toString() },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        product: true
      }
    })

    if (orders.length === 0) {
      await ctx.reply('📭 سفارشی یافت نشد')
      return
    }

    let message = '📋 آخرین سفارشات شما:\n\n'
    orders.forEach((order, index) => {
      message += `${index + 1}. ${order.product.title}\n`
      message += `   وضعیت: ${order.status}\n`
      message += `   تاریخ: ${new Date(order.createdAt).toLocaleDateString('fa-IR')}\n\n`
    })

    await ctx.reply(message)
  } catch (error) {
    console.error('Error fetching orders:', error)
    await ctx.reply('❌ خطا در دریافت سفارشات')
  }
})

// تماس با پشتیبانی
bot.command('contact', async (ctx) => {
  await ctx.reply(
    `📞 راه‌های ارتباطی:\n\n` +
    `👤 پشتیبانی: @your_support_username\n` +
    `📧 ایمیل: support@example.com\n` +
    `🌐 وب‌سایت: your-domain.com`
  )
})

export { bot }