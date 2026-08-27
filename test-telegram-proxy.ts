import { Telegraf } from 'telegraf'
import { HttpsProxyAgent } from 'https-proxy-agent'

const proxyAgent = new HttpsProxyAgent('http://127.0.0.1:10530')

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