import { NextResponse } from 'next/server'
import { bot } from '@/lib/telegram'
import { getCurrentUser } from '@/lib/auth'

let isPolling = false
let pollingStartPromise: Promise<void> | null = null

async function requireAdmin(): Promise<boolean> {
  const user = await getCurrentUser()

  return user?.role === 'ADMIN'
}

export async function GET() {
  try {
    // ============================================================
    // Authentication / Authorization
    // ============================================================

    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 401 }
      )
    }

    // ============================================================
    // Polling
    //
    // Polling فقط در Development مجاز است.
    // در Production باید از Webhook استفاده شود.
    // ============================================================

    if (process.env.NODE_ENV !== 'production') {
      if (!isPolling) {
        if (!pollingStartPromise) {
          pollingStartPromise = (async () => {
            try {
              await bot.launch()

              isPolling = true

              console.log(
                'Telegram bot polling started'
              )
            } catch (error) {
              isPolling = false

              console.error(
                'Failed to start Telegram bot polling:',
                error instanceof Error
                  ? error.message
                  : error
              )

              throw error
            } finally {
              pollingStartPromise = null
            }
          })()
        }

        await pollingStartPromise
      }
    }

    // ============================================================
    // بررسی اتصال Bot
    // ============================================================

    const botInfo =
      await bot.telegram.getMe()

    return NextResponse.json({
      status:
        process.env.NODE_ENV === 'production'
          ? 'stopped'
          : isPolling
            ? 'running'
            : 'stopped',
      mode: process.env.NODE_ENV,
      botName: botInfo.first_name,
      botUsername: botInfo.username,
    })
  } catch (error) {
    console.error(
      'Telegram polling error:',
      error instanceof Error
        ? error.message
        : error
    )

    return NextResponse.json(
      {
        status: 'error',
        error:
          'خطا در ارتباط با Telegram Bot',
      },
      {
        status: 500,
      }
    )
  }
}

export async function POST() {
  try {
    // ============================================================
    // Authentication / Authorization
    // ============================================================

    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 401 }
      )
    }

    // ============================================================
    // Polling فقط در Development
    // ============================================================

    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        {
          error:
            'Polling در محیط Production مجاز نیست. از Telegram Webhook استفاده کنید.',
        },
        {
          status: 409,
        }
      )
    }

    // ============================================================
    // Stop Polling
    // ============================================================

    if (!isPolling) {
      return NextResponse.json({
        success: true,
        status: 'stopped',
      })
    }

    try {
      await bot.stop()
    } catch (error) {
      console.error(
        'Failed to stop Telegram polling:',
        error instanceof Error
          ? error.message
          : error
      )

      return NextResponse.json(
        {
          error:
            'خطا در توقف Telegram Bot',
        },
        {
          status: 500,
        }
      )
    }

    isPolling = false

    console.log(
      'Telegram bot polling stopped'
    )

    return NextResponse.json({
      success: true,
      status: 'stopped',
    })
  } catch (error) {
    console.error(
      'POST /api/telegram-polling error:',
      error instanceof Error
        ? error.message
        : error
    )

    return NextResponse.json(
      {
        error:
          'خطا در مدیریت Telegram Bot',
      },
      {
        status: 500,
      }
    )
  }
}