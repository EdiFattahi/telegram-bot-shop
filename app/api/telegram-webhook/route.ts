import { NextResponse } from 'next/server'
import { z } from 'zod'
import { bot } from '@/lib/telegram'

type TelegramUpdate = Parameters<
  typeof bot.handleUpdate
>[0]

const MAX_BODY_SIZE = 1024 * 1024 // 1 MB

const telegramUpdateSchema = z
  .object({
    update_id: z.number().int(),
  })
  .passthrough()

export async function POST(req: Request) {
  try {
    // ============================================================
    // Webhook Secret
    // ============================================================

    const configuredSecret =
      process.env.TELEGRAM_WEBHOOK_SECRET

    const receivedSecret =
      req.headers.get(
        'x-telegram-bot-api-secret-token'
      )

    if (
      !configuredSecret ||
      receivedSecret !== configuredSecret
    ) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    // ============================================================
    // Content-Type
    // ============================================================

    const contentType =
      req.headers.get('content-type')

    if (
      !contentType ||
      !contentType
        .toLowerCase()
        .includes('application/json')
    ) {
      return NextResponse.json(
        {
          error: 'Invalid content type',
        },
        {
          status: 415,
        }
      )
    }

    // ============================================================
    // Payload Size
    // ============================================================

    const contentLength =
      req.headers.get('content-length')

    if (contentLength) {
      const parsedLength =
        Number(contentLength)

      if (
        !Number.isSafeInteger(parsedLength) ||
        parsedLength < 0 ||
        parsedLength > MAX_BODY_SIZE
      ) {
        return NextResponse.json(
          {
            error: 'Payload too large',
          },
          {
            status: 413,
          }
        )
      }
    }

    // ============================================================
    // Parse JSON
    // ============================================================

    let body: unknown

    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid JSON payload',
        },
        {
          status: 400,
        }
      )
    }

    // ============================================================
    // Runtime Validation
    // ============================================================

    const result =
      telegramUpdateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Invalid Telegram update',
        },
        {
          status: 400,
        }
      )
    }

    // ============================================================
    // Handle Telegram Update
    // ============================================================

    const update =
      body as TelegramUpdate

    await bot.handleUpdate(update)

    // ============================================================
    // Success
    // ============================================================

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(
      'Telegram webhook error:',
      error instanceof Error
        ? error.message
        : error
    )

    return NextResponse.json(
      {
        error: 'Failed to process update',
      },
      {
        status: 500,
      }
    )
  }
}
