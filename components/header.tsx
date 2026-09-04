'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Menu,
  X,
  ArrowLeft,
  Sparkles,
  LogOut,
  LayoutDashboard,
} from 'lucide-react'

const menuItems = [
  { href: '/', label: 'خانه' },
  { href: '/products', label: 'محصولات' },
  { href: '/about', label: 'درباره ما' },
  { href: '/contact', label: 'تماس با ما' },
  { href: '/order-website', label: 'سفارش سایت' },
]

interface CurrentUser {
  id: string
  email: string
  name: string | null
  role: string
}

interface AuthMeResponse {
  user: CurrentUser | null
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const [user, setUser] =
    useState<CurrentUser | null>(null)

  const [authLoading, setAuthLoading] =
    useState(true)

  const [logoutLoading, setLogoutLoading] =
    useState(false)

  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener(
      'scroll',
      handleScroll
    )

    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll
      )
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    const loadCurrentUser = async () => {
      try {
        const response = await fetch(
          '/api/auth/me',
          {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal,
          }
        )

        if (controller.signal.aborted) {
          return
        }

        if (!response.ok) {
          setUser(null)
          return
        }

        const data =
          (await response.json()) as AuthMeResponse

        if (
          data &&
          data.user &&
          typeof data.user.id === 'string' &&
          typeof data.user.email === 'string' &&
          typeof data.user.role === 'string'
        ) {
          setUser(data.user)
        } else {
          setUser(null)
        }
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          return
        }

        console.error(
          'Error fetching current user:',
          error
        )

        setUser(null)
      } finally {
        if (!controller.signal.aborted) {
          setAuthLoading(false)
        }
      }
    }

    void loadCurrentUser()

    return () => {
      controller.abort()
    }
  }, [pathname])

  const isActive = (href: string) =>
    pathname === href

  const handleLogout = async () => {
    if (logoutLoading) {
      return
    }

    setLogoutLoading(true)

    try {
      const response = await fetch(
        '/api/auth/logout',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        let message =
          'خطا در خروج از حساب'

        try {
          const data =
            (await response.json()) as {
              error?: unknown
            }

          if (
            typeof data.error === 'string' &&
            data.error.trim()
          ) {
            message = data.error
          }
        } catch {
          // پاسخ JSON معتبر نبود؛
          // پیام پیش‌فرض استفاده می‌شود.
        }

        throw new Error(message)
      }

      setUser(null)
      setIsOpen(false)

      router.push('/')
      router.refresh()
    } catch (error) {
      console.error(
        'Logout error:',
        error
      )

      alert(
        error instanceof Error
          ? error.message
          : 'خطا در خروج از حساب'
      )
    } finally {
      setLogoutLoading(false)
    }
  }

  const displayName =
    user?.name?.trim() ||
    user?.email ||
    'کاربر'

  const isAdmin =
    user?.role === 'ADMIN'

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-gray-950/80 backdrop-blur-xl border-b border-white/10'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* لوگو */}
          <Link
            href="/"
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>

            <span className="text-xl font-bold text-white">
              WEPIXO
            </span>
          </Link>

          {/* منوی دسکتاپ */}
          <nav className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(item.href)
                    ? 'text-white bg-white/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* دکمه‌های دسکتاپ */}
          <div className="hidden md:flex items-center gap-3">
            {authLoading ? (
              <div
                className="h-9 w-20 rounded-lg bg-white/5 animate-pulse"
                aria-hidden="true"
              />
            ) : user ? (
              <>
                <span
                  className="max-w-[180px] truncate px-3 py-2 text-sm font-medium text-gray-300"
                  title={user.email}
                >
                  {displayName}
                </span>

                {isAdmin && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    پنل مدیریت
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() =>
                    void handleLogout()
                  }
                  disabled={logoutLoading}
                  className="inline-flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <LogOut
                    className={`h-4 w-4 ${
                      logoutLoading
                        ? 'animate-pulse'
                        : ''
                    }`}
                  />

                  {logoutLoading
                    ? 'در حال خروج...'
                    : 'خروج'}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-400 hover:text-white text-sm font-medium transition-colors px-3 py-2"
                >
                  ورود
                </Link>

                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-l from-blue-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  شروع کنید

                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>

          {/* دکمه منوی موبایل */}
          <button
            type="button"
            onClick={() =>
              setIsOpen(!isOpen)
            }
            aria-label={
              isOpen
                ? 'بستن منو'
                : 'باز کردن منو'
            }
            aria-expanded={isOpen}
            className="md:hidden text-gray-300 hover:text-white transition-colors"
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* منوی موبایل */}
      {isOpen && (
        <div className="md:hidden bg-gray-950/95 backdrop-blur-xl border-b border-white/10">
          <nav className="px-6 py-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-white bg-white/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                onClick={() =>
                  setIsOpen(false)
                }
              >
                {item.label}
              </Link>
            ))}

            <div className="pt-4 space-y-2 border-t border-white/10">
              {authLoading ? (
                <div className="h-10 rounded-lg bg-white/5 animate-pulse" />
              ) : user ? (
                <>
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium text-white truncate">
                      {displayName}
                    </p>

                    <p
                      dir="ltr"
                      className="mt-1 text-xs text-gray-500 truncate text-right"
                    >
                      {user.email}
                    </p>
                  </div>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition-colors"
                      onClick={() =>
                        setIsOpen(false)
                      }
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      پنل مدیریت
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      void handleLogout()
                    }
                    disabled={logoutLoading}
                    className="w-full flex items-center gap-2 px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <LogOut
                      className={`h-4 w-4 ${
                        logoutLoading
                          ? 'animate-pulse'
                          : ''
                      }`}
                    />

                    {logoutLoading
                      ? 'در حال خروج...'
                      : 'خروج'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block px-4 py-3 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                    onClick={() =>
                      setIsOpen(false)
                    }
                  >
                    ورود
                  </Link>

                  <Link
                    href="/products"
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-l from-blue-600 to-purple-600 text-white rounded-xl text-sm font-medium"
                    onClick={() =>
                      setIsOpen(false)
                    }
                  >
                    شروع کنید

                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}