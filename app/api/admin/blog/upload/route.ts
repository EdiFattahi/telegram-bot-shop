import { NextResponse } from 'next/server'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

import { getCurrentUser } from '@/lib/auth'

// ============================================================
// Runtime
// ============================================================

export const runtime = 'nodejs'

// ============================================================
// Constants
// ============================================================

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const UPLOAD_DIRECTORY = path.join(
  process.cwd(),
  'public',
  'uploads',
  'blog'
)

const ALLOWED_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const

type AllowedMimeType = keyof typeof ALLOWED_TYPES

// ============================================================
// Helpers
// ============================================================

function isAllowedMimeType(
  value: string
): value is AllowedMimeType {
  return value in ALLOWED_TYPES
}

async function requireAdmin(): Promise<boolean> {
  const user = await getCurrentUser()

  return user?.role === 'ADMIN'
}

function generateSafeFileName(
  extension: string
): string {
  const randomName = crypto
    .randomBytes(16)
    .toString('hex')

  return `${Date.now()}-${randomName}.${extension}`
}

// ============================================================
// Magic Bytes Validation
// ============================================================

function isJpeg(buffer: Buffer): boolean {
  if (buffer.length < 3) {
    return false
  }

  return (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  )
}

function isPng(buffer: Buffer): boolean {
  if (buffer.length < 8) {
    return false
  }

  return (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  )
}

function isWebp(buffer: Buffer): boolean {
  if (buffer.length < 12) {
    return false
  }

  return (
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50 // P
  )
}

function matchesMimeType(
  buffer: Buffer,
  mimeType: AllowedMimeType
): boolean {
  switch (mimeType) {
    case 'image/jpeg':
      return isJpeg(buffer)

    case 'image/png':
      return isPng(buffer)

    case 'image/webp':
      return isWebp(buffer)

    default:
      return false
  }
}

// ============================================================
// POST /api/admin/blog/upload
// Upload blog cover image
// ============================================================

export async function POST(
  request: Request
) {
  try {
    // --------------------------------------------------------
    // Authorization
    // --------------------------------------------------------

    if (!(await requireAdmin())) {
      return NextResponse.json(
        {
          error: 'دسترسی غیرمجاز',
        },
        {
          status: 401,
        }
      )
    }

    // --------------------------------------------------------
    // Content-Type
    // --------------------------------------------------------

    const contentType =
      request.headers.get('content-type') ?? ''

    if (
      !contentType
        .toLowerCase()
        .includes('multipart/form-data')
    ) {
      return NextResponse.json(
        {
          error:
            'نوع درخواست باید multipart/form-data باشد',
        },
        {
          status: 400,
        }
      )
    }

    // --------------------------------------------------------
    // Parse FormData
    // --------------------------------------------------------

    let formData: FormData

    try {
      formData = await request.formData()
    } catch (error) {
      console.error(
        'Blog upload form-data error:',
        error
      )

      return NextResponse.json(
        {
          error:
            'داده ارسالی فایل نامعتبر است',
        },
        {
          status: 400,
        }
      )
    }

    // --------------------------------------------------------
    // Get file
    // --------------------------------------------------------

    const fileValue = formData.get('file')

    if (!(fileValue instanceof File)) {
      return NextResponse.json(
        {
          error:
            'فایل تصویر ارسال نشده است',
        },
        {
          status: 400,
        }
      )
    }

    // --------------------------------------------------------
    // Validate file size
    // --------------------------------------------------------

    if (fileValue.size <= 0) {
      return NextResponse.json(
        {
          error:
            'فایل تصویر خالی است',
        },
        {
          status: 400,
        }
      )
    }

    if (fileValue.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error:
            'حجم تصویر نباید بیشتر از ۵ مگابایت باشد',
        },
        {
          status: 400,
        }
      )
    }

    // --------------------------------------------------------
    // Validate declared MIME type
    // --------------------------------------------------------

    const mimeType =
      fileValue.type.toLowerCase()

    if (!isAllowedMimeType(mimeType)) {
      return NextResponse.json(
        {
          error:
            'فرمت تصویر مجاز نیست. فقط JPG، PNG و WEBP مجاز هستند.',
        },
        {
          status: 400,
        }
      )
    }

    // --------------------------------------------------------
    // Read file
    // --------------------------------------------------------

    const arrayBuffer =
      await fileValue.arrayBuffer()

    const buffer =
      Buffer.from(arrayBuffer)

    // --------------------------------------------------------
    // Validate actual file signature
    // --------------------------------------------------------

    if (
      !matchesMimeType(
        buffer,
        mimeType
      )
    ) {
      return NextResponse.json(
        {
          error:
            'محتوای واقعی فایل با فرمت اعلام‌شده مطابقت ندارد',
        },
        {
          status: 400,
        }
      )
    }

    // --------------------------------------------------------
    // Generate safe file name
    // --------------------------------------------------------

    const extension =
      ALLOWED_TYPES[mimeType]

    const fileName =
      generateSafeFileName(extension)

    // --------------------------------------------------------
    // Ensure upload directory exists
    // --------------------------------------------------------

    await mkdir(
      UPLOAD_DIRECTORY,
      {
        recursive: true,
      }
    )

    // --------------------------------------------------------
    // Build target path
    // --------------------------------------------------------

    const filePath =
      path.join(
        UPLOAD_DIRECTORY,
        fileName
      )

    // --------------------------------------------------------
    // Write file
    // --------------------------------------------------------

    await writeFile(
      filePath,
      buffer,
      {
        flag: 'wx',
      }
    )

    // --------------------------------------------------------
    // Public URL
    // --------------------------------------------------------

    const publicUrl =
      `/uploads/blog/${fileName}`

    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
        fileName,
        mimeType,
        size: fileValue.size,
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    console.error(
      'POST /api/admin/blog/upload error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'خطا در آپلود تصویر مقاله',
      },
      {
        status: 500,
      }
    )
  }
}
