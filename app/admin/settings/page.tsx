'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Settings {
  siteName: string
  siteDescription: string
  contactEmail: string
  telegramUsername: string
}

const DEFAULT_SETTINGS: Settings = {
  siteName: 'AI Services',
  siteDescription: '',
  contactEmail: '',
  telegramUsername: '',
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings', {
          method: 'GET',
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('خطا در دریافت تنظیمات')
        }

        const data = (await response.json()) as Partial<Settings>

        if (!cancelled) {
          setSettings({
            siteName: data.siteName ?? DEFAULT_SETTINGS.siteName,
            siteDescription:
              data.siteDescription ?? DEFAULT_SETTINGS.siteDescription,
            contactEmail:
              data.contactEmail ?? DEFAULT_SETTINGS.contactEmail,
            telegramUsername:
              data.telegramUsername ?? DEFAULT_SETTINGS.telegramUsername,
          })
        }
      } catch (err) {
        console.error('Error loading settings:', err)

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'خطا در دریافت تنظیمات'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadSettings()

    return () => {
      cancelled = true
    }
  }, [])

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target

    setSettings((current) => ({
      ...current,
      [name]: value,
    }))

    setMessage('')
    setError('')
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setSaving(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      const data = (await response.json()) as {
        error?: string
      }

      if (!response.ok) {
        throw new Error(
          data.error || 'خطا در ذخیره تنظیمات'
        )
      }

      setMessage('تنظیمات با موفقیت ذخیره شد.')
    } catch (err) {
      console.error('Error saving settings:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'خطا در ذخیره تنظیمات'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">
          در حال بارگذاری تنظیمات...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          تنظیمات
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          مدیریت تنظیمات اصلی وب‌سایت
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            تنظیمات عمومی
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="siteName">
                نام سایت
              </Label>

              <Input
                id="siteName"
                name="siteName"
                value={settings.siteName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="h-px w-full bg-border" />

            <div className="space-y-2">
              <Label htmlFor="siteDescription">
                توضیحات سایت
              </Label>

              <Input
                id="siteDescription"
                name="siteDescription"
                value={settings.siteDescription}
                onChange={handleChange}
              />
            </div>

            <div className="h-px w-full bg-border" />

            <div className="space-y-2">
              <Label htmlFor="contactEmail">
                ایمیل تماس
              </Label>

              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                value={settings.contactEmail}
                onChange={handleChange}
              />
            </div>

            <div className="h-px w-full bg-border" />

            <div className="space-y-2">
              <Label htmlFor="telegramUsername">
                نام کاربری تلگرام
              </Label>

              <Input
                id="telegramUsername"
                name="telegramUsername"
                value={settings.telegramUsername}
                onChange={handleChange}
                placeholder="@username"
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {message}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={saving}
              >
                {saving
                  ? 'در حال ذخیره...'
                  : 'ذخیره تنظیمات'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}