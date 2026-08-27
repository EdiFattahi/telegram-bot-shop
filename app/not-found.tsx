import Link from 'next/link'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-9xl font-bold gradient-text mb-4">۴۰۴</h1>
        <h2 className="text-3xl font-bold text-white mb-4">صفحه یافت نشد</h2>
        <p className="text-gray-400 mb-8">
          متاسفانه صفحه مورد نظر شما وجود ندارد
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-l from-blue-600 to-purple-600 text-white rounded-xl hover:scale-105 transition-transform"
          >
            <Home className="w-5 h-5" />
            بازگشت به خانه
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
          >
            <Search className="w-5 h-5" />
            مشاهده محصولات
          </Link>
        </div>
      </div>
    </div>
  )
}