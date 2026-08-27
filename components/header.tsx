'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'

const menuItems = [
  { href: '/', label: 'خانه' },
  { href: '/products', label: 'محصولات' },
  { href: '/about', label: 'درباره ما' },
  { href: '/contact', label: 'تماس با ما' },
  { href: '/order-website', label: 'سفارش سایت' },
]

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (href: string) => pathname === href

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-gray-950/80 backdrop-blur-xl border-b border-white/10' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* لوگو */}
          <Link href="/" className="flex items-center gap-2">
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

          {/* دکمه‌ها */}
          <div className="hidden md:flex items-center gap-3">
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
          </div>

          {/* دکمه منوی موبایل */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-300 hover:text-white transition-colors"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 space-y-2 border-t border-white/10">
              <Link
                href="/login"
                className="block px-4 py-3 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                onClick={() => setIsOpen(false)}
              >
                ورود
              </Link>
              <Link
                href="/products"
                className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-l from-blue-600 to-purple-600 text-white rounded-xl text-sm font-medium"
                onClick={() => setIsOpen(false)}
              >
                شروع کنید
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}