'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import {
  ArrowRight,
  Loader2,
  Save,
} from 'lucide-react'

interface ApiError {
  error?: string
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

function transliteratePersian(value: string): string {
  const map: Record<string, string> = {
    'ا': 'a',
    'آ': 'a',
    'ب': 'b',
    'پ': 'p',
    'ت': 't',
    'ث': 's',
    'ج': 'j',
    'چ': 'ch',
    'ح': 'h',
    'خ': 'kh',
    'د': 'd',
    'ذ': 'z',
    'ر': 'r',
    'ز': 'z',
    'ژ': 'zh',
    'س': 's',
    'ش': 'sh',
    'ص': 's',
    'ض': 'z',
    'ط': 't',
    'ظ': 'z',
    'ع': 'a',
    'غ': 'gh',
    'ف': 'f',
    'ق': 'gh',
    'ک': 'k',
    'گ': 'g',
    'ل': 'l',
    'م': 'm',
    'ن': 'n',
    'و': 'v',
    'ه': 'h',
    'ی': 'y',
    'ئ': 'y',
    'ء': '',
    'ٔ': '',
    '‌': '-',
  }

  return value
    .toLowerCase()
    .split('')
    .map((character) => map[character] ?? character)
    .join('')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

function createSlug(title: string): string {
  return transliteratePersian(title).slice(0, 100)
}

export default function NewBlogPage() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [published, setPublished] = useState(false)

  const [slugManuallyEdited, setSlugManuallyEdited] =
    useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleTitleChange = (
    value: string
  ) => {
    setTitle(value)

    if (!slugManuallyEdited) {
      setSlug(createSlug(value))
    }
  }

  const handleSlugChange = (
    value: string
  ) => {
    setSlugManuallyEdited(true)

    const normalized = transliteratePersian(value)
      .slice(0, 100)

    setSlug(normalized)
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (saving) {
      return
    }

    setError('')

    const trimmedTitle = title.trim()
    const trimmedSlug = slug.trim()
    const trimmedExcerpt = excerpt.trim()
    const trimmedContent = content.trim()
    const trimmedCoverImage =
      coverImage.trim()

    if (
      !trimmedTitle ||
      !trimmedSlug ||
      !trimmedExcerpt ||
      !trimmedContent
    ) {
      setError(
        'لطفاً تمام فیلدهای ضروری را کامل کنید.'
      )
      return
    }

    if (trimmedTitle.length > 200) {
      setError(
        'عنوان مقاله نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد.'
      )
      return
    }

    if (trimmedSlug.length > 100) {
      setError(
        'اسلاگ نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد.'
      )
      return
    }

    if (trimmedExcerpt.length > 500) {
      setError(
        'خلاصه مقاله نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد.'
      )
      return
    }

    if (trimmedContent.length > 100000) {
      setError(
        'محتوای مقاله بیش از حد طولانی است.'
      )
      return
    }

    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
        trimmedSlug
      )
    ) {
      setError(
        'اسلاگ باید فقط شامل حروف انگلیسی کوچک، اعداد و خط تیره باشد.'
      )
      return
    }

    try {
      setSaving(true)

      const response = await fetch(
        '/api/admin/blog',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: trimmedTitle,
            slug: trimmedSlug,
            excerpt: trimmedExcerpt,
            content: trimmedContent,
            coverImage:
              trimmedCoverImage || null,
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
          'خطا در ایجاد مقاله'
        )
      }

      router.push('/admin/blog')
      router.refresh()
    } catch (error) {
      console.error(
        'Create blog post error:',
        error
      )

      setError(
        error instanceof Error
          ? error.message
          : 'خطا در ایجاد مقاله'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      dir="rtl"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/blog"
          className="inline-flex items-center justify-center rounded-lg border p-2 transition-colors hover:bg-muted"
          aria-label="بازگشت به مقالات"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold">
            ایجاد مقاله جدید
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            مقاله جدید وبلاگ را ایجاد و منتشر کنید.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
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
                <span className="text-destructive">
                  {' '}*
                </span>
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
                disabled={saving}
                placeholder="مثلاً: راهنمای کامل ربات‌های تلگرام"
                className="w-full rounded-lg border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <label
                htmlFor="slug"
                className="text-sm font-medium"
              >
                Slug
                <span className="text-destructive">
                  {' '}*
                </span>
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
                disabled={saving}
                dir="ltr"
                placeholder="telegram-bot-guide"
                className="w-full rounded-lg border bg-background px-4 py-3 text-left text-sm outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              />

              <p className="text-xs text-muted-foreground">
                اسلاگ به‌صورت خودکار از عنوان ساخته می‌شود.
                در صورت نیاز می‌توانید آن را دستی اصلاح کنید.
              </p>
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <label
                htmlFor="excerpt"
                className="text-sm font-medium"
              >
                خلاصه مقاله
                <span className="text-destructive">
                  {' '}*
                </span>
              </label>

              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(event) =>
                  setExcerpt(event.target.value)
                }
                maxLength={500}
                rows={4}
                disabled={saving}
                placeholder="خلاصه کوتاهی از محتوای مقاله..."
                className="w-full resize-y rounded-lg border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              />

              <div className="text-left text-xs text-muted-foreground">
                {excerpt.length} / 500
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label
                htmlFor="content"
                className="text-sm font-medium"
              >
                محتوای مقاله
                <span className="text-destructive">
                  {' '}*
                </span>
              </label>

              <textarea
                id="content"
                value={content}
                onChange={(event) =>
                  setContent(event.target.value)
                }
                rows={16}
                disabled={saving}
                placeholder="محتوای کامل مقاله را وارد کنید..."
                className="w-full resize-y rounded-lg border bg-background px-4 py-3 text-sm leading-7 outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              />

              <div className="text-left text-xs text-muted-foreground">
                {content.length.toLocaleString(
                  'fa-IR'
                )}{' '}
                کاراکتر
              </div>
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <label
                htmlFor="coverImage"
                className="text-sm font-medium"
              >
                لینک تصویر کاور
              </label>

              <input
                id="coverImage"
                type="text"
                value={coverImage}
                onChange={(event) =>
                  setCoverImage(
                    event.target.value
                  )
                }
                disabled={saving}
                dir="ltr"
                placeholder="/images/blog/cover.jpg"
                className="w-full rounded-lg border bg-background px-4 py-3 text-left text-sm outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              />

              <p className="text-xs text-muted-foreground">
                اختیاری است. می‌توانید مسیر داخلی یا URL تصویر را وارد کنید.
              </p>
            </div>

            {/* Published */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(event) =>
                    setPublished(
                      event.target.checked
                    )
                  }
                  disabled={saving}
                  className="h-4 w-4"
                />

                <div>
                  <div className="text-sm font-medium">
                    انتشار مقاله
                  </div>

                  <div className="mt-1 text-xs text-muted-foreground">
                    {published
                      ? 'مقاله بلافاصله پس از ایجاد منتشر خواهد شد.'
                      : 'مقاله به‌صورت پیش‌نویس ذخیره خواهد شد.'}
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/blog"
            className="inline-flex items-center rounded-lg border px-5 py-2.5 text-sm transition-colors hover:bg-muted"
          >
            انصراف
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {saving
              ? 'در حال ذخیره...'
              : 'ذخیره مقاله'}
          </button>
        </div>
      </form>
    </div>
  )
}
