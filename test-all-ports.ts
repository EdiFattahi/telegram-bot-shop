import { Telegraf } from 'telegraf'
import { SocksProxyAgent } from 'socks-proxy-agent'

const ports = [1080, 10808, 7890, 7891, 10530, 10531, 10532, 10533, 8080, 8181, 10628, 3080]

async function testPort(port: number) {
  try {
    const proxyAgent = new SocksProxyAgent(`socks5://127.0.0.1:${port}`)
    const bot = new Telegraf('8910273359:AAEanxeE9CaWYZ6dOnlLiucWbGu7s2Lcn3Q', {
      telegram: {
        agent: proxyAgent
      }
    })
    
    const botInfo = await bot.telegram.getMe()
    console.log(`✅ پورت ${port} کار میکنه!`)
    console.log(`نام ربات: ${botInfo.first_name}`)
    return true
  } catch (error) {
    console.log(`❌ پورت ${port} کار نمیکنه`)
    return false
  }
}

async function testAll() {
  for (const port of ports) {
    await testPort(port)
  }
}

testAll()