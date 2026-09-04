import { NextResponse } from 'next/server'

import { z } from 'zod'

import { prisma } from '@/lib/prisma'

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'نام نامعتبر است')
    .max(100, 'نام بیش از حد طولانی است'),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('فرمت ایمیل نامعتبر است')
    .max(254, 'ایمیل بیش از حد طولانی است'),

  subject: z
    .string()
    .trim()
    .min(2, 'موضوع نامعتبر است')
    .max(200, 'موضوع بیش از حد طولانی است'),

  message: z
    .string()
    .trim()
    .min(10, 'پیام بیش از حد کوتاه است')
    .max(5000, 'پیام بیش از حد طولانی است'),
})

export async function POST(req: Request) {
  try {
    // ============================================================
    // Content-Type
    // ============================================================

    const contentType = req.headers.get('content-type')

    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        {
          error: 'نوع داده ارسالی نامعتبر است',
        },
        { status: 415 }
      )
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
          error: 'داده ارسالی نامعتبر است',
        },
        { status: 400 }
      )
    }

    // ============================================================
    // Validate
    // ============================================================

    const result = contactSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'اطلاعات واردشده معتبر نیست',
        },
        { status: 400 }
      )
    }

    const data = result.data

    // ============================================================
    // Create Contact Message
    // ============================================================

    await prisma.contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
      },
    })

    // ============================================================
    // Response
    // ============================================================

    return NextResponse.json(
      {
        success: true,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(
      'POST /api/contact error:',
      error instanceof Error
        ? error.message
        : error
    )

    return NextResponse.json(
      {
        error: 'خطا در ارسال پیام. لطفاً دوباره تلاش کنید.',
      },
      { status: 500 }
    )
  }
}