import { NextResponse } from 'next/server'
import { bot } from '@/lib/telegram'

export async function POST(req: Request) {
  try {
    // بررسی secret token (امنیت)
    const secretToken = req.headers.get('x-telegram-bot-api-secret-token')
    if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const update = await req.json()
    await bot.handleUpdate(update)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ error: 'Failed to process update' }, { status: 500 })
  }
}