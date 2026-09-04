import {  } from '@/components/ui/card'
import { Target, Award, Heart, Zap} from 'lucide-react'
import Particles from '@/components/particles'

export const metadata = {
  title: 'درباره ما | فروشگاه محصولات دیجیتال',
  description: 'آشنایی با تیم ما و ماموریت ما در ارائه راهکارهای دیجیتال',
}

export default function AboutPage() {
  const values = [
    { icon: Target, title: 'ماموریت ما', desc: 'توانمندسازی کسب‌وکارها با راهکارهای دیجیتال نوآورانه' },
    { icon: Award, title: 'کیفیت', desc: 'ارائه محصولات با بالاترین استانداردهای کیفیت' },
    { icon: Heart, title: 'رضایت مشتری', desc: 'اولویت ما رضایت کامل مشتریان است' },
    { icon: Zap, title: 'نوآوری', desc: 'استفاده از جدیدترین تکنولوژی‌ها و روش‌ها' },
  ]

  const team = [
    { name: 'ادریس فتاحی', role: 'بنیان‌گذار و مدیرعامل', initials: 'اف' },
    { name: 'تیم توسعه', role: 'توسعه‌دهندگان', initials: 'ت' },
    { name: 'تیم پشتیبانی', role: 'پشتیبانی ۲۴/۷', initials: 'پ' },
  ]

  return (
    <div className="relative min-h-screen">
      <Particles />
      
      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">درباره ما</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed">
            ما تیمی متخصص در زمینه راهکارهای دیجیتال هستیم. هدف ما کمک به کسب‌وکارها برای رشد و پیشرفت در دنیای دیجیتال است.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="relative py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="gradient-text">ارزش‌های ما</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="glass-card rounded-2xl p-6 text-center card-hover">
                <value.icon className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                <h3 className="text-lg font-bold text-white mb-2">{value.title}</h3>
                <p className="text-gray-400 text-sm">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="relative py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="gradient-text">تیم ما</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {team.map((member, index) => (
              <div key={index} className="glass-card rounded-2xl p-8 text-center card-hover">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{member.initials}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{member.name}</h3>
                <p className="text-gray-400">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-3xl p-8">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <h3 className="text-3xl font-bold text-blue-400">+۵</h3>
                <p className="text-gray-400 mt-1">سال تجربه</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-purple-400">+۱۵۰</h3>
                <p className="text-gray-400 mt-1">پروژه موفق</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-green-400">+۵۰۰</h3>
                <p className="text-gray-400 mt-1">مشتری راضی</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}