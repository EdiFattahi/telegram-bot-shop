import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, 
  Bot, 
  Building2, 
  Brain, 
  Globe,
  Sparkles,
  Shield,
  Clock,
  Zap,
  ChevronLeft,
  Star
} from 'lucide-react'
import NeuralNetwork from '@/components/neural-network'
import TestimonialCarousel from '@/components/testimonial-carousel'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const products = await prisma.product.findMany({
    where: { status: 'active' },
    take: 6,
    orderBy: { createdAt: 'desc' }
  })

  const testimonials = await prisma.testimonial.findMany({
    take: 6,
    orderBy: { createdAt: 'desc' }
  })

  const services = [
    {
      icon: Bot,
      title: 'ربات تلگرام',
      description: 'اتوماسیون کامل فروش و پشتیبانی',
      href: '/products/telegram-order-bot',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Building2,
      title: 'اتوماسیون اداری',
      description: 'مدیریت هوشمند فرآیندها',
      href: '/products/office-automation',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Brain,
      title: 'هوش مصنوعی',
      description: 'راهکارهای AI برای رشد',
      href: '/products/ai-consulting',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Globe,
      title: 'طراحی سایت',
      description: 'وب‌سایت مدرن و حرفه‌ای',
      href: '/order-website',
      gradient: 'from-orange-500 to-red-500',
    },
  ]

  const features = [
    {
      icon: Shield,
      title: 'امنیت بالا',
      description: 'رمزنگاری کامل اطلاعات',
    },
    {
      icon: Zap,
      title: 'سرعت فوق‌العاده',
      description: 'عملکرد بهینه و سریع',
    },
    {
      icon: Clock,
      title: 'پشتیبانی ۲۴/۷',
      description: 'همیشه در کنار شما',
    },
    {
      icon: Star,
      title: 'رضایت مشتری',
      description: '۹۸٪ رضایت کاربران',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ========== HERO ========== */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* پس‌زمینه */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-950 to-black" />
        <NeuralNetwork />
        
        {/* گرادیان‌های رنگی */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="mb-8 animate-fade-in">
            <span className="inline-block px-6 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-medium text-blue-300">
              ✨ راهکارهای دیجیتال نسل جدید
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-l from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              خدمات دیجیتال
            </span>
            <br />
            <span>برای آینده کسب‌وکار شما</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            از ربات تلگرام و اتوماسیون اداری تا هوش مصنوعی و طراحی سایت
            — همه چیز برای تحول دیجیتال
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="group inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-2xl text-lg font-medium hover:bg-blue-700 transition-all hover:scale-105"
            >
              مشاهده خدمات
              <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-lg font-medium hover:bg-white/10 transition-all"
            >
              مشاوره رایگان
            </Link>
          </div>

          {/* آمار */}
          <div className="grid grid-cols-3 gap-8 mt-20 max-w-2xl mx-auto">
            <div>
              <h3 className="text-3xl font-bold text-white">+۱۵۰</h3>
              <p className="text-gray-500 text-sm mt-1">مشتری راضی</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-white">+۵۰۰</h3>
              <p className="text-gray-500 text-sm mt-1">پروژه موفق</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-white">۹۸٪</h3>
              <p className="text-gray-500 text-sm mt-1">رضایت مشتری</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SERVICES ========== */}
      <section className="py-24 px-6 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              خدمات ما
            </h2>
            <p className="text-gray-400 text-lg">
              راهکارهای کامل برای دیجیتالی شدن
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service, index) => (
              <Link
                key={index}
                href={service.href}
                className="group bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`bg-gradient-to-br ${service.gradient} rounded-xl p-3 flex-shrink-0`}>
                    <service.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {service.title}
                    </h3>
                    <p className="text-gray-400 mb-4">
                      {service.description}
                    </p>
                    <span className="inline-flex items-center text-blue-400 font-medium">
                      بیشتر بدانید
                      <ChevronLeft className="mr-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== WHY US ========== */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              چرا ما؟
            </h2>
            <p className="text-gray-400 text-lg">
              دلایلی که به ما اعتماد می‌کنند
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all"
              >
                <feature.icon className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                <h3 className="text-lg font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PRODUCTS ========== */}
      {products.length > 0 && (
        <section className="py-24 px-6 bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                محصولات منتخب
              </h2>
              <p className="text-gray-400 text-lg">
                پرطرفدارترین خدمات ما
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <div className="h-40 bg-gradient-to-br from-blue-900/50 to-purple-900/50 flex items-center justify-center">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.title}
                        width={800}
                        height={400}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Sparkles className="w-12 h-12 text-blue-400/50" />
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-2">
                      {product.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {product.shortDesc}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-400 font-bold">
                        {product.priceBase.toLocaleString('fa-IR')} تومان
                      </span>
                      <span className="text-sm text-gray-500">شروع قیمت از</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========== TESTIMONIALS ========== */}
      {testimonials.length > 0 && (
        <TestimonialCarousel testimonials={testimonials} />
      )}

      {/* ========== CTA ========== */}
      <section className="py-24 px-6 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            آماده شروع پروژه هستید؟
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            همین امروز با ما تماس بگیرید
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-2xl text-lg font-medium hover:bg-blue-700 transition-all"
            >
              تماس با ما
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-lg font-medium hover:bg-white/10 transition-all"
            >
              مشاهده خدمات
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}