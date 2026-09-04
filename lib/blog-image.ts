import path from 'node:path'
import { unlink } from 'node:fs/promises'

const BLOG_UPLOAD_DIR = path.join(
  process.cwd(),
  'public',
  'uploads',
  'blog'
)

const BLOG_UPLOAD_PREFIX = '/uploads/blog/'

function isLocalBlogImageUrl(
  value: string
): boolean {
  return value.startsWith(
    BLOG_UPLOAD_PREFIX
  )
}

function getSafeBlogImagePath(
  value: string
): string | null {
  if (!isLocalBlogImageUrl(value)) {
    return null
  }

  const relativePath = value
    .slice(BLOG_UPLOAD_PREFIX.length)
    .trim()

  if (!relativePath) {
    return null
  }

  /*
   * فقط نام فایل تولیدشده توسط سیستم را
   * قبول می‌کنیم.
   *
   * مسیرهایی مثل:
   * ../../something
   * uploads/blog/../../something
   * /etc/passwd
   * رد می‌شوند.
   */
  if (
    relativePath.includes('/') ||
    relativePath.includes('\\') ||
    relativePath.includes('..')
  ) {
    return null
  }

  const filePath = path.resolve(
    BLOG_UPLOAD_DIR,
    relativePath
  )

  const uploadDirWithSeparator =
    path.resolve(BLOG_UPLOAD_DIR) +
    path.sep

  if (
    !filePath.startsWith(
      uploadDirWithSeparator
    )
  ) {
    return null
  }

  return filePath
}

export async function deleteBlogImage(
  imageUrl: string | null | undefined
): Promise<boolean> {
  if (
    typeof imageUrl !== 'string' ||
    !imageUrl.trim()
  ) {
    return false
  }

  const trimmed = imageUrl.trim()

  const filePath =
    getSafeBlogImagePath(trimmed)

  if (!filePath) {
    /*
     * تصویر خارجی یا مسیر نامعتبر است.
     * هیچ فایلی حذف نمی‌شود.
     */
    return false
  }

  try {
    await unlink(filePath)

    return true
  } catch (error: unknown) {
    /*
     * اگر فایل قبلاً حذف شده باشد،
     * وضعیت مطلوب است و خطا محسوب نمی‌شود.
     */
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return false
    }

    throw error
  }
}