import { Telegraf } from 'telegraf'
import { SocksProxyAgent } from 'socks-proxy-agent'

// تلگرام دسکتاپ معمولاً از SOCKS5 روی پورت 10808 استفاده میکنه
// یا ممکنه پورت دیگه باشه
const proxyAgent = new SocksProxyAgent('socks5://127.0.0.1:10808')

const bot = new Telegraf('8910273359:AAEanxeE9CaWYZ6dOnlLiucWbGu7s2Lcn3Q', {
  telegram: {
    agent: proxyAgent
  }
})

async function testBot() {
  try {
    const botInfo = await bot.telegram.getMe()
    console.log('✅ اتصال موفق!')
    console.log('نام ربات:', botInfo.first_name)
    console.log('یوزرنیم:', botInfo.username)
  } catch (error) {
    console.error('❌ خطا در اتصال:', error)
  }
}

testBot()