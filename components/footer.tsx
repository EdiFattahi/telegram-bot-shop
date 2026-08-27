import Link from 'next/link'
import { Sparkles, Send, Mail, Phone, MapPin, ChevronLeft } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10">
      {/* بخش اصلی فوتر */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          {/* برند */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">WEPIXO</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              راهکارهای دیجیتال برای رشد کسب‌وکار شما
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <Send className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <Mail className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <Phone className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* دسترسی سریع */}
          <div>
            <h3 className="text-white font-bold mb-4">دسترسی سریع</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/products" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1">
                  <ChevronLeft className="h-3 w-3" />
                  محصولات
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1">
                  <ChevronLeft className="h-3 w-3" />
                  درباره ما
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1">
                  <ChevronLeft className="h-3 w-3" />
                  تماس با ما
                </Link>
              </li>
              <li>
                <Link href="/order-website" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1">
                  <ChevronLeft className="h-3 w-3" />
                  سفارش سایت
                </Link>
              </li>
            </ul>
          </div>

          {/* خدمات */}
          <div>
            <h3 className="text-white font-bold mb-4">خدمات</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/products/telegram-order-bot" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1">
                  <ChevronLeft className="h-3 w-3" />
                  ربات تلگرام
                </Link>
              </li>
              <li>
                <Link href="/products/office-automation" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1">
                  <ChevronLeft className="h-3 w-3" />
                  اتوماسیون اداری
                </Link>
              </li>
              <li>
                <Link href="/products/ai-consulting" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1">
                  <ChevronLeft className="h-3 w-3" />
                  مشاوره هوش مصنوعی
                </Link>
              </li>
              <li>
                <Link href="/products/website-design" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1">
                  <ChevronLeft className="h-3 w-3" />
                  طراحی سایت
                </Link>
              </li>
            </ul>
          </div>

          {/* اطلاعات تماس */}
          <div>
            <h3 className="text-white font-bold mb-4">اطلاعات تماس</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Send className="h-4 w-4 text-blue-400" />
                @wepixo
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Mail className="h-4 w-4 text-blue-400" />
                info@wepixo.com
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Phone className="h-4 w-4 text-blue-400" />
                ۰۹۱۲-۳۴۵-۶۷۸۹
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <MapPin className="h-4 w-4 text-blue-400" />
                تهران، ایران
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* کپی‌رایت */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © ۱۴۰۳ WEPIXO. همه حقوق محفوظ است.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                قوانین و مقررات
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                حریم خصوصی
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}