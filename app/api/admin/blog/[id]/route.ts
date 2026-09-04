import { NextResponse } from 'next/server'
import { deleteBlogImage } from '@/lib/blog-image'
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
// Helpers
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

function isValidBlogId(
  value: unknown
): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().length <= 100
  )
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
// GET /api/admin/blog/[id]
// Get single blog post
// ============================================================

export async function GET(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
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
    // Params
    // --------------------------------------------------------

    const { id } = await params

    if (!isValidBlogId(id)) {
      return NextResponse.json(
        {
          error: 'شناسه مقاله نامعتبر است',
        },
        {
          status: 400,
        }
      )
    }

    const postId = id.trim()

    // --------------------------------------------------------
    // Find post
    // --------------------------------------------------------

    const post =
      await prisma.blogPost.findUnique({
        where: {
          id: postId,
        },
      })

    if (!post) {
      return NextResponse.json(
        {
          error: 'مقاله یافت نشد',
        },
        {
          status: 404,
        }
      )
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error(
      'GET /api/admin/blog/[id] error:',
      error
    )

    return NextResponse.json(
      {
        error: 'خطا در دریافت مقاله',
      },
      {
        status: 500,
      }
    )
  }
}

// ============================================================
// PUT /api/admin/blog/[id]
// Update blog post
// ============================================================

export async function PUT(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
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
    // Params
    // --------------------------------------------------------

    const { id } = await params

    if (!isValidBlogId(id)) {
      return NextResponse.json(
        {
          error: 'شناسه مقاله نامعتبر است',
        },
        {
          status: 400,
        }
      )
    }

    const postId = id.trim()

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

    const published = body.published

    // --------------------------------------------------------
    // Published validation
    // --------------------------------------------------------

    if (typeof published !== 'boolean') {
      return NextResponse.json(
        {
          error:
            'وضعیت انتشار مقاله نامعتبر است',
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
          error:
            'لینک تصویر مقاله نامعتبر است',
        },
        {
          status: 400,
        }
      )
    }

    // --------------------------------------------------------
    // Check existing post
    // --------------------------------------------------------

    const existingPost =
      await prisma.blogPost.findUnique({
        where: {
          id: postId,
        },
        select: {
          id: true,
          coverImage: true,
        },
      })

    if (!existingPost) {
      return NextResponse.json(
        {
          error: 'مقاله یافت نشد',
        },
        {
          status: 404,
        }
      )
    }

    // --------------------------------------------------------
    // Duplicate slug check
    // --------------------------------------------------------

    const duplicateSlug =
      await prisma.blogPost.findFirst({
        where: {
          slug,
          NOT: {
            id: postId,
          },
        },
        select: {
          id: true,
        },
      })

    if (duplicateSlug) {
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
    // Update post
    // --------------------------------------------------------

    try {
      const previousCoverImage =
        existingPost.coverImage

      const newCoverImage =
        coverImage || null

      const post =
        await prisma.blogPost.update({
          where: {
            id: postId,
          },
          data: {
            title,
            slug,
            content,
            excerpt,
            coverImage: newCoverImage,
            published,
          },
        })

      /*
      * فقط بعد از موفقیت Update دیتابیس،
      * تصویر قبلی را حذف می‌کنیم.
      *
      * اگر تصویر تغییر نکرده باشد،
      * هیچ فایلی حذف نمی‌شود.
      */
      if (
        previousCoverImage &&
        previousCoverImage !== newCoverImage
      ) {
        try {
          await deleteBlogImage(
            previousCoverImage
          )
        } catch (error) {
          /*
          * شکست در پاک‌سازی فایل نباید باعث
          * شکست Update موفق مقاله شود.
          */
          console.error(
            'Failed to delete previous blog cover image:',
            error
          )
        }
      }

return NextResponse.json(post)
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
      'PUT /api/admin/blog/[id] error:',
      error
    )

    return NextResponse.json(
      {
        error: 'خطا در ویرایش مقاله',
      },
      {
        status: 500,
      }
    )
  }
}

// ============================================================
// DELETE /api/admin/blog/[id]
// Delete blog post
// ============================================================

export async function DELETE(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
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
    // Params
    // --------------------------------------------------------

    const { id } = await params

    if (!isValidBlogId(id)) {
      return NextResponse.json(
        {
          error: 'شناسه مقاله نامعتبر است',
        },
        {
          status: 400,
        }
      )
    }

    const postId = id.trim()

    // --------------------------------------------------------
    // Check existing post
    // --------------------------------------------------------

    const existingPost =
      await prisma.blogPost.findUnique({
        where: {
          id: postId,
        },
        select: {
          id: true,
          coverImage: true,
        },
      })

    if (!existingPost) {
      return NextResponse.json(
        {
          error: 'مقاله یافت نشد',
        },
        {
          status: 404,
        }
      )
    }

    // --------------------------------------------------------
    // Delete
    // --------------------------------------------------------

    await prisma.blogPost.delete({
      where: {
        id: postId,
      },
    })

    /*
    * حذف فایل Cover بعد از حذف موفق مقاله.
    */
    if (existingPost.coverImage) {
      try {
        await deleteBlogImage(
          existingPost.coverImage
        )
      } catch (error) {
        /*
        * مقاله حذف شده است؛ بنابراین نباید
        * به خاطر خطای File Cleanup پاسخ DELETE
        * را شکست‌خورده اعلام کنیم.
        */
        console.error(
          'Failed to delete blog cover image after post deletion:',
          error
        )
      }
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(
      'DELETE /api/admin/blog/[id] error:',
      error
    )

    return NextResponse.json(
      {
        error: 'خطا در حذف مقاله',
      },
      {
        status: 500,
      }
    )
  }
}