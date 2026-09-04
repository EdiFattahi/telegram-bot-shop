import { NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth'

const SETTING_KEYS = [
  'siteName',
  'siteDescription',
  'contactEmail',
  'telegramUsername',
] as const

type SettingKey = (typeof SETTING_KEYS)[number]

const DEFAULT_SETTINGS: Record<
  SettingKey,
  string
> = {
  siteName: 'AI Services',
  siteDescription: '',
  contactEmail: '',
  telegramUsername: '',
}

const settingsSchema = z
  .object({
    siteName: z
      .string()
      .trim()
      .min(1, 'نام سایت الزامی است')
      .max(
        100,
        'نام سایت نمی‌تواند بیشتر از 100 کاراکتر باشد'
      ),

    siteDescription: z
      .string()
      .trim()
      .max(
        1000,
        'توضیحات سایت نمی‌تواند بیشتر از 1000 کاراکتر باشد'
      ),

    contactEmail: z
      .string()
      .trim()
      .max(
        254,
        'ایمیل نمی‌تواند بیشتر از 254 کاراکتر باشد'
      )
      .refine(
        (value) =>
          value === '' ||
          z
            .string()
            .email()
            .safeParse(value).success,
        'فرمت ایمیل نامعتبر است'
      ),

    telegramUsername: z
      .string()
      .trim()
      .max(
        64,
        'نام کاربری تلگرام نمی‌تواند بیشتر از 64 کاراکتر باشد'
      )
      .refine(
        (value) =>
          value === '' ||
          /^@?[a-zA-Z0-9_]{5,32}$/.test(value),
        'نام کاربری تلگرام نامعتبر است'
      ),
  })
  .strict()

function unauthorizedResponse() {
  return NextResponse.json(
    {
      error: 'Unauthorized',
    },
    {
      status: 401,
    }
  )
}

export async function GET() {
  try {
    const admin = await isAdmin()

    if (!admin) {
      return unauthorizedResponse()
    }

    const settings =
      await prisma.setting.findMany({
        where: {
          key: {
            in: [...SETTING_KEYS],
          },
        },
        select: {
          key: true,
          value: true,
        },
      })

    const result: Record<
      SettingKey,
      string
    > = {
      ...DEFAULT_SETTINGS,
    }

    for (const setting of settings) {
      if (
        SETTING_KEYS.includes(
          setting.key as SettingKey
        )
      ) {
        result[
          setting.key as SettingKey
        ] = setting.value
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error(
      'GET /api/admin/settings error:',
      error
    )

    return NextResponse.json(
      {
        error: 'خطا در دریافت تنظیمات',
      },
      {
        status: 500,
      }
    )
  }
}

export async function PUT(
  request: Request
) {
  try {
    const admin = await isAdmin()

    if (!admin) {
      return unauthorizedResponse()
    }

    let body: unknown

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          error:
            'بدنه درخواست JSON نامعتبر است',
        },
        {
          status: 400,
        }
      )
    }

    const parsed =
      settingsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            'اطلاعات تنظیمات نامعتبر است',
          details:
            parsed.error.flatten()
              .fieldErrors,
        },
        {
          status: 400,
        }
      )
    }

    const settings = parsed.data

    await prisma.$transaction(
      SETTING_KEYS.map((key) =>
        prisma.setting.upsert({
          where: {
            key,
          },
          update: {
            value: settings[key],
          },
          create: {
            key,
            value: settings[key],
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      ...settings,
    })
  } catch (error) {
    console.error(
      'PUT /api/admin/settings error:',
      error
    )

    return NextResponse.json(
      {
        error: 'خطا در ذخیره تنظیمات',
      },
      {
        status: 500,
      }
    )
  }
}