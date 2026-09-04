'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  ArrowRight,
  Loader2,
  Save,
  Eye,
  EyeOff,
  Upload,
  ImageIcon,
  Trash2,
} from 'lucide-react'

interface BlogPost {
  id: string
  slug: string
  title: string
  content: string
  excerpt: string
  coverImage: string | null
  published: boolean
  createdAt: string
  updatedAt: string
}

interface ApiError {
  error?: string
}

interface UploadResponse {
  success: true
  url: string
  fileName: string
  mimeType: string
  size: number
}

function isApiError(
  value: unknown
): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof value.error === 'string'
  )
}

function isBlogPost(
  value: unknown
): value is BlogPost {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false
  }

  const post = value as Record<string, unknown>

  return (
    typeof post.id === 'string' &&
    typeof post.slug === 'string' &&
    typeof post.title === 'string' &&
    typeof post.content === 'string' &&
    typeof post.excerpt === 'string' &&
    (typeof post.coverImage === 'string' ||
      post.coverImage === null) &&
    typeof post.published === 'boolean' &&
    typeof post.createdAt === 'string' &&
    typeof post.updatedAt === 'string'
  )
}

function isUploadResponse(
  value: unknown
): value is UploadResponse {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false
  }

  const data = value as Record<string, unknown>

  return (
    data.success === true &&
    typeof data.url === 'string' &&
    typeof data.fileName === 'string' &&
    typeof data.mimeType === 'string' &&
    typeof data.size === 'number'
  )
}

function generateSlug(
  value: string
): string {
  const transliterationMap: Record<
    string,
    string
  > = {
    آ: 'a',
    ا: 'a',
    ب: 'b',
    پ: 'p',
    ت: 't',
    ث: 's',
    ج: 'j',
    چ: 'ch',
    ح: 'h',
    خ: 'kh',
    د: 'd',
    ذ: 'z',
    ر: 'r',
    ز: 'z',
    ژ: 'zh',
    س: 's',
    ش: 'sh',
    ص: 's',
    ض: 'z',
    ط: 't',
    ظ: 'z',
    ع: 'a',
    غ: 'gh',
    ف: 'f',
    ق: 'gh',
    ک: 'k',
    گ: 'g',
    ل: 'l',
    م: 'm',
    ن: 'n',
    و: 'v',
    ه: 'h',
    ی: 'y',
    ي: 'y',
    ئ: 'y',
    ء: '',
    ة: 'h',
    أ: 'a',
    إ: 'e',
    ٱ: 'a',
  }

  const normalized = value
    .trim()
    .toLowerCase()

  let result = ''

  for (const char of normalized) {
    if (
      /[a-z0-9]/.test(char)
    ) {
      result += char
      continue
    }

    if (
      transliterationMap[char] !== undefined
    ) {
      result +=
        transliterationMap[char]
      continue
    }

    if (
      char === ' ' ||
      char === '_' ||
      char === '-'
    ) {
      result += '-'
    }
  }

  return result
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100)
}

function isLocalBlogImage(
  value: string
): boolean {
  return value.startsWith(
    '/uploads/blog/'
  )
}

export default function EditBlogPage() {
  const params = useParams<{
    id: string
  }>()

  const id = params.id

  const fileInputRef =
    useRef<HTMLInputElement | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [uploading, setUploading] =
    useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  const [title, setTitle] =
    useState('')

  const [slug, setSlug] =
    useState('')

  const [excerpt, setExcerpt] =
    useState('')

  const [content, setContent] =
    useState('')

  const [coverImage, setCoverImage] =
    useState('')

  const [published, setPublished] =
    useState(false)

  const [slugManuallyEdited, setSlugManuallyEdited] =
    useState(true)

  /*
   * Load article
   */
  useEffect(() => {
    let cancelled = false

    const loadPost = async () => {
      try {
        setLoading(true)
        setError('')
        setSuccess('')

        const response = await fetch(
          `/api/admin/blog/${id}`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        )

        const data: unknown =
          await response.json()

        if (!response.ok) {
          if (isApiError(data)) {
            throw new Error(data.error)
          }

          throw new Error(
            'خطا در دریافت مقاله'
          )
        }

        if (!isBlogPost(data)) {
          throw new Error(
            'ساختار اطلاعات مقاله نامعتبر است'
          )
        }

        if (cancelled) {
          return
        }

        setTitle(data.title)
        setSlug(data.slug)
        setExcerpt(data.excerpt)
        setContent(data.content)
        setCoverImage(
          data.coverImage ?? ''
        )
        setPublished(data.published)

        /*
         * در Edit، slug موجود را
         * خودکار تغییر نمی‌دهیم.
         */
        setSlugManuallyEdited(true)
      } catch (error) {
        if (cancelled) {
          return
        }

        console.error(
          'Load blog post error:',
          error
        )

        setError(
          error instanceof Error
            ? error.message
            : 'خطا در دریافت مقاله'
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    if (id) {
      void loadPost()
    }

    return () => {
      cancelled = true
    }
  }, [id])

  /*
   * Title
   */
  const handleTitleChange = (
    value: string
  ) => {
    setTitle(value)

    if (!slugManuallyEdited) {
      setSlug(generateSlug(value))
    }
  }

  /*
   * Slug
   */
  const handleSlugChange = (
    value: string
  ) => {
    setSlugManuallyEdited(true)

    setSlug(
      generateSlug(value)
    )
  }

  /*
   * Upload cover image
   */
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0]

    /*
     * Reset input so selecting the
     * same file again triggers change.
     */
    event.target.value = ''

    if (!file) {
      return
    }

    try {
      setUploading(true)
      setError('')
      setSuccess('')

      /*
       * Client-side checks are only for UX.
       * Server-side validation remains authoritative.
       */
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
      ]

      if (
        !allowedTypes.includes(
          file.type
        )
      ) {
        throw new Error(
          'فرمت تصویر مجاز نیست. فقط JPG، PNG، WEBP و GIF مجاز هستند.'
        )
      }

      /*
       * 5 MB client-side UX limit.
       * Server-side route must also enforce its own limit.
       */
      const maxSize =
        5 * 1024 * 1024

      if (file.size > maxSize) {
        throw new Error(
          'حجم تصویر نباید بیشتر از ۵ مگابایت باشد.'
        )
      }

      const formData =
        new FormData()

      formData.append(
        'file',
        file
      )

      const response = await fetch(
        '/api/admin/blog/upload',
        {
          method: 'POST',
          body: formData,
        }
      )

      const data: unknown =
        await response.json()

      if (!response.ok) {
        if (isApiError(data)) {
          throw new Error(data.error)
        }

        throw new Error(
          'خطا در آپلود تصویر'
        )
      }

      if (!isUploadResponse(data)) {
        throw new Error(
          'ساختار پاسخ آپلود تصویر نامعتبر است'
        )
      }

      setCoverImage(data.url)

      setSuccess(
        'تصویر با موفقیت آپلود شد. برای ثبت تغییرات مقاله، روی «ذخیره تغییرات» کلیک کنید.'
      )
    } catch (error) {
      console.error(
        'Blog image upload error:',
        error
      )

      setError(
        error instanceof Error
          ? error.message
          : 'خطا در آپلود تصویر'
      )
    } finally {
      setUploading(false)
    }
  }

  /*
   * Remove currently selected cover image
   *
   * توجه:
   * این فقط تصویر را از فرم حذف می‌کند.
   * حذف فیزیکی فایل توسط API هنگام Save انجام می‌شود.
   */
  const handleRemoveImage = () => {
    setCoverImage('')
    setError('')
    setSuccess(
      'تصویر از مقاله حذف شد. برای ثبت تغییرات، روی «ذخیره تغییرات» کلیک کنید.'
    )
  }

  /*
   * Save article
   */
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await fetch(
        `/api/admin/blog/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            title: title.trim(),
            slug: slug.trim(),
            excerpt: excerpt.trim(),
            content: content.trim(),
            coverImage:
              coverImage.trim(),
            published,
          }),
        }
      )

      const data: unknown =
        await response.json()

      if (!response.ok) {
        if (isApiError(data)) {
          throw new Error(data.error)
        }

        throw new Error(
          'خطا در ذخیره مقاله'
        )
      }

      if (!isBlogPost(data)) {
        throw new Error(
          'ساختار پاسخ ذخیره مقاله نامعتبر است'
        )
      }

      setTitle(data.title)
      setSlug(data.slug)
      setExcerpt(data.excerpt)
      setContent(data.content)
      setCoverImage(
        data.coverImage ?? ''
      )
      setPublished(data.published)

      setSuccess(
        'مقاله با موفقیت ذخیره شد.'
      )
    } catch (error) {
      console.error(
        'Update blog post error:',
        error
      )

      setError(
        error instanceof Error
          ? error.message
          : 'خطا در ذخیره مقاله'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div
        dir="rtl"
        className="flex min-h-[500px] items-center justify-center"
      >
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />

          در حال دریافت مقاله...
        </div>
      </div>
    )
  }

  if (error && !title && !content) {
    return (
      <div
        dir="rtl"
        className="space-y-6"
      >
        <div>
          <Link
            href="/admin/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowRight className="h-4 w-4" />

            بازگشت به مدیریت وبلاگ
          </Link>
        </div>

        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div
      dir="rtl"
      className="mx-auto max-w-5xl space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/blog"
            className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowRight className="h-4 w-4" />

            بازگشت به مدیریت وبلاگ
          </Link>

          <h1 className="text-2xl font-bold">
            ویرایش مقاله
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            اطلاعات مقاله را ویرایش و ذخیره کنید.
          </p>
        </div>

        <div
          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
            published
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {published ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}

          {published
            ? 'منتشر شده'
            : 'پیش‌نویس'}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-400">
          {success}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <div className="rounded-xl border bg-card p-6">
          <div className="space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="text-sm font-medium"
              >
                عنوان مقاله
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(event) =>
                  handleTitleChange(
                    event.target.value
                  )
                }
                maxLength={200}
                required
                className="w-full rounded-lg border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="عنوان مقاله را وارد کنید"
              />

              <div className="text-left text-xs text-muted-foreground">
                {title.length}/200
              </div>
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <label
                htmlFor="slug"
                className="text-sm font-medium"
              >
                Slug
              </label>

              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(event) =>
                  handleSlugChange(
                    event.target.value
                  )
                }
                maxLength={100}
                required
                dir="ltr"
                className="w-full rounded-lg border bg-background px-4 py-3 text-left text-sm font-mono outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="article-slug"
              />

              <p className="text-xs text-muted-foreground">
                برای SEO بهتر، فقط حروف انگلیسی،
                اعداد و خط تیره استفاده کنید.
              </p>
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <label
                htmlFor="excerpt"
                className="text-sm font-medium"
              >
                خلاصه مقاله
              </label>

              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(event) =>
                  setExcerpt(
                    event.target.value
                  )
                }
                maxLength={1000}
                rows={4}
                required
                className="w-full resize-y rounded-lg border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="خلاصه کوتاهی از مقاله..."
              />

              <div className="text-left text-xs text-muted-foreground">
                {excerpt.length}/1000
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label
                htmlFor="content"
                className="text-sm font-medium"
              >
                محتوای مقاله
              </label>

              <textarea
                id="content"
                value={content}
                onChange={(event) =>
                  setContent(
                    event.target.value
                  )
                }
                maxLength={100000}
                rows={20}
                required
                className="w-full resize-y rounded-lg border bg-background px-4 py-3 text-sm leading-7 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="محتوای کامل مقاله..."
              />

              <div className="text-left text-xs text-muted-foreground">
                {content.length}/100000
              </div>
            </div>

            {/* Cover image */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">
                  تصویر مقاله
                  <span className="mr-1 text-xs font-normal text-muted-foreground">
                    (اختیاری)
                  </span>
                </label>

                <p className="mt-1 text-xs text-muted-foreground">
                  تصویر را مستقیماً در سرور سایت آپلود کنید.
                  فرمت‌های JPG، PNG، WEBP و GIF پشتیبانی می‌شوند.
                </p>
              </div>

              {/* Upload control */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  disabled={uploading || saving}
                  className="hidden"
                />

                <button
                  type="button"
                  disabled={
                    uploading || saving
                  }
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg border bg-background px-5 py-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      در حال آپلود...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      انتخاب و آپلود تصویر
                    </>
                  )}
                </button>

                {coverImage.trim() && (
                  <button
                    type="button"
                    disabled={
                      uploading || saving
                    }
                    onClick={
                      handleRemoveImage
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive/30 px-5 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف تصویر
                  </button>
                )}
              </div>

              {/* Image URL */}
              {coverImage.trim() && (
                <div
                  dir="ltr"
                  className="rounded-lg bg-muted/50 px-3 py-2 text-left text-xs text-muted-foreground"
                >
                  {coverImage}
                </div>
              )}

              {/* Preview */}
              {coverImage.trim() &&
                isLocalBlogImage(
                  coverImage.trim()
                ) && (
                  <div className="overflow-hidden rounded-xl border bg-muted">
                    <div className="relative aspect-video w-full">
                      <Image
                        src={coverImage.trim()}
                        alt={`پیش‌نمایش تصویر مقاله: ${title}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 768px"
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

              {/* Fallback for non-local URLs */}
              {coverImage.trim() &&
                !isLocalBlogImage(
                  coverImage.trim()
                ) && (
                  <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
                    <ImageIcon className="h-5 w-5 shrink-0" />

                    <span>
                      این تصویر یک مسیر داخلی آپلودشده نیست.
                      برای استفاده از سیستم جدید، تصویر را
                      دوباره از طریق دکمه «انتخاب و آپلود تصویر»
                      آپلود کنید.
                    </span>
                  </div>
                )}
            </div>

            {/* Published */}
            <div className="rounded-lg border p-4">
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">
                    وضعیت انتشار
                  </div>

                  <div className="mt-1 text-xs text-muted-foreground">
                    {published
                      ? 'این مقاله در سایت منتشر شده است.'
                      : 'این مقاله به صورت پیش‌نویس ذخیره خواهد شد.'}
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={published}
                  aria-label="تغییر وضعیت انتشار مقاله"
                  onClick={() =>
                    setPublished(
                      (current) => !current
                    )
                  }
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    published
                      ? 'bg-primary'
                      : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                      published
                        ? 'right-1'
                        : 'right-6'
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Link
            href="/admin/blog"
            className="inline-flex items-center justify-center rounded-lg border px-5 py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            انصراف
          </Link>

          <button
            type="submit"
            disabled={
              saving || uploading
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />

                در حال ذخیره...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />

                ذخیره تغییرات
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}