import { NextResponse } from 'next/server'
import { bot } from '@/lib/telegram'

let isPolling = false

export async function GET() {
  try {
    if (!isPolling && process.env.NODE_ENV !== 'production') {
      // توقف polling قبلی اگه وجود داره
      if (isPolling) {
        await bot.stop()
      }
      
      // شروع polling
      await bot.launch()
      isPolling = true
      console.log('✅ Telegram bot polling started')
    }

    // تست اتصال
    const botInfo = await bot.telegram.getMe()
    
    return NextResponse.json({ 
      status: isPolling ? 'running' : 'stopped',
      mode: process.env.NODE_ENV,
      botName: botInfo.first_name,
      botUsername: botInfo.username
    })
  } catch (error) {
    console.error('❌ Error in telegram polling:', error)
    return NextResponse.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    if (isPolling) {
      await bot.stop()
      isPolling = false
      console.log('✅ Telegram bot polling stopped')
    }

    return NextResponse.json({ status: 'stopped' })
  } catch (error) {
    console.error('Error stopping polling:', error)
    return NextResponse.json({ error: 'Failed to stop' }, { status: 500 })
  }
}