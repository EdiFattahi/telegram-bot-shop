import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// ============================================================
// Constants
// ============================================================

const MAX_TITLE_LENGTH = 200
const MAX_SLUG_LENGTH = 100
const MAX_EXCERPT_LENGTH = 1_000
const MAX_CONTENT_LENGTH = 100_000
const MAX_COVER_IMAGE_LENGTH = 2_000

// ============================================================
// Types / Helpers
// ============================================================

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function normalizeSlug(value: unknown): string {
  return typeof value === 'string'
    ? value.trim().toLowerCase()
    : ''
}


function isValidOptionalUrl(
  value: unknown
): boolean {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return true
  }

  if (typeof value !== 'string') {
    return false
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return true
  }

  if (trimmed.length > MAX_COVER_IMAGE_LENGTH) {
    return false
  }

  // مسیر داخلی سایت
  // مثال:
  // /images/blog.jpg
  // /uploads/article-cover.webp
  if (trimmed.startsWith('/')) {
    return /^\/[a-zA-Z0-9/_\-.]+$/.test(trimmed)
  }

  try {
    const url = new URL(trimmed)

    return (
      (url.protocol === 'http:' ||
        url.protocol === 'https:') &&
      Boolean(url.hostname)
    )
  } catch {
    return false
  }
}

async function requireAdmin(): Promise<boolean> {
  const user = await getCurrentUser()

  return user?.role === 'ADMIN'
}

// ============================================================
// GET /api/admin/blog
// List all blog posts
// ============================================================

export async function GET() {
  try {
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

    const posts =
      await prisma.blogPost.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          slug: true,
          title: true,
          content: true,
          excerpt: true,
          coverImage: true,
          published: true,
          createdAt: true,
          updatedAt: true,
        },
      })

    return NextResponse.json(posts)
  } catch (error) {
    console.error(
      'GET /api/admin/blog error:',
      error
    )

    return NextResponse.json(
      {
        error: 'خطا در دریافت مقالات',
      },
      {
        status: 500,
      }
    )
  }
}

// ============================================================
// POST /api/admin/blog
// Create blog post
// ============================================================

export async function POST(req: Request) {
  try {
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
    // Parse JSON
    // --------------------------------------------------------

    let body: unknown

    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        {
          error: 'داده ارسالی نامعتبر است',
        },
        {
          status: 400,
        }
      )
    }

    if (!isObject(body)) {
      return NextResponse.json(
        {
          error: 'داده ارسالی نامعتبر است',
        },
        {
          status: 400,
        }
      )
    }

    // --------------------------------------------------------
    // Normalize fields
    // --------------------------------------------------------

    const title =
      typeof body.title === 'string'
        ? body.title.trim()
        : ''

    const slug = normalizeSlug(body.slug)

    const content =
      typeof body.content === 'string'
        ? body.content.trim()
        : ''

    const excerpt =
      typeof body.excerpt === 'string'
        ? body.excerpt.trim()
        : ''

    const coverImage =
      typeof body.coverImage === 'string'
        ? body.coverImage.trim()
        : ''

    const published =
      body.published === undefined
        ? false
        : body.published

    // --------------------------------------------------------
    // Published validation
    // --------------------------------------------------------

    if (typeof published !== 'boolean') {
      return NextResponse.json(
        {
          error: 'وضعیت انتشار مقاله نامعتبر است',
        },
        {
          status: 400,
        }
      )
    }

    // --------------------------------------------------------
    // Required fields
    // --------------------------------------------------------

    if (
      !title ||
      !slug ||
      !content ||
      !excerpt
    ) {
      return NextResponse.json(
        {
          error:
            'عنوان، اسلاگ، خلاصه و محتوای مقاله الزامی هستند',
        },
        {
          status: 400,
        }
      )
    }

    // --------------------------------------------------------
    // Length validation
    // --------------------------------------------------------

    if (title.length > MAX_TITLE_LENGTH) {
      return NextResponse.json(
        {
          error:
            'عنوان مقاله بیش از حد طولانی است',
        },
        {
          status: 400,
        }
      )
    }

    if (slug.length > MAX_SLUG_LENGTH) {
      return NextResponse.json(
        {
          error:
            'اسلاگ مقاله بیش از حد طولانی است',
        },
        {
          status: 400,
        }
      )
    }

    if (excerpt.length > MAX_EXCERPT_LENGTH) {
      return NextResponse.json(
        {
          error:
            'خلاصه مقاله بیش از حد طولانی است',
        },
        {
          status: 400,
        }
      )
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        {
          error:
            'محتوای مقاله بیش از حد طولانی است',
        },
        {
          status: 400,
        }
      )
    }

    // --------------------------------------------------------
    // Slug validation
    // --------------------------------------------------------

    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
        slug
      )
    ) {
      return NextResponse.json(
        {
          error:
            'اسلاگ باید فقط شامل حروف انگلیسی کوچک، اعداد و خط تیره باشد',
        },
        {
          status: 400,
        }
      )
    }

    // --------------------------------------------------------
    // Cover image validation
    // --------------------------------------------------------

    if (!isValidOptionalUrl(coverImage)) {
      return NextResponse.json(
        {
          error: 'لینک تصویر مقاله نامعتبر است',
        },
        {
          status: 400,
        }
      )
    }

    // --------------------------------------------------------
    // Duplicate slug check
    // --------------------------------------------------------

    const existingPost =
      await prisma.blogPost.findUnique({
        where: {
          slug,
        },
        select: {
          id: true,
        },
      })

    if (existingPost) {
      return NextResponse.json(
        {
          error:
            'این اسلاگ قبلاً برای مقاله دیگری استفاده شده است',
        },
        {
          status: 409,
        }
      )
    }

    // --------------------------------------------------------
    // Create post
    // --------------------------------------------------------

    try {
      const post =
        await prisma.blogPost.create({
          data: {
            title,
            slug,
            content,
            excerpt,
            coverImage:
              coverImage || null,
            published,
          },
        })

      return NextResponse.json(
        post,
        {
          status: 201,
        }
      )
    } catch (error: unknown) {
      // ------------------------------------------------------
      // Prisma unique constraint
      // ------------------------------------------------------

      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        return NextResponse.json(
          {
            error:
              'این اسلاگ قبلاً برای مقاله دیگری استفاده شده است',
          },
          {
            status: 409,
          }
        )
      }

      throw error
    }
  } catch (error) {
    console.error(
      'POST /api/admin/blog error:',
      error
    )

    return NextResponse.json(
      {
        error: 'خطا در ایجاد مقاله',
      },
      {
        status: 500,
      }
    )
  }
}