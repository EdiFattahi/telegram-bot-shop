'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ArrowLeft, Sparkles, Zap, Shield } from 'lucide-react'
import Particles from '@/components/particles'

export default function OrderWebsitePage() {
  const [selectedPlan, setSelectedPlan] = useState('pro')

  const plans = [
    {
      id: 'basic',
      name: 'پایه',
      price: '۷,۹۰۰,۰۰۰',
      features: [
        'طراحی UI/UX اختصاصی',
        'تا ۵ صفحه',
        'واکنش‌گرا (موبایل و دسکتاپ)',
        'بهینه‌سازی SEO',
        'پشتیبانی ۳ ماهه',
      ],
      popular: false,
    },
    {
      id: 'pro',
      name: 'حرفه‌ای',
      price: '۱۴,۹۰۰,۰۰۰',
      features: [
        'طراحی UI/UX پیشرفته',
        'تا ۱۰ صفحه',
        'واکنش‌گرا + PWA',
        'SEO پیشرفته',
        'پنل مدیریت محتوا',
        'پشتیبانی ۶ ماهه',
      ],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'سازمانی',
      price: '۲۹,۹۰۰,۰۰۰',
      features: [
        'طراحی کاملاً اختصاصی',
        'صفحات نامحدود',
        'همه امکانات + اپلیکیشن',
        'SEO + آنالیتیکس',
        'پنل مدیریت پیشرفته',
        'پشتیبانی ۱۲ ماهه',
      ],
      popular: false,
    },
  ]

  return (
    <div className="relative min-h-screen">
      <Particles />
      
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">سفارش طراحی سایت</span>
            </h1>
            <p className="text-gray-400 text-lg">
              وب‌سایت مدرن و حرفه‌ای برای کسب‌وکار شما
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`glass-card rounded-2xl p-8 card-hover cursor-pointer relative ${
                  selectedPlan === plan.id ? 'border-blue-500 shadow-2xl' : ''
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-4 right-1/2 translate-x-1/2">
                    <span className="bg-gradient-to-l from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm">
                      محبوب‌ترین
                    </span>
                  </div>
                )}
                
                <h2 className="text-2xl font-bold text-white mb-2">{plan.name}</h2>
                <p className="text-3xl font-bold text-blue-400 mb-6">
                  {plan.price}
                  <span className="text-sm text-gray-400"> تومان</span>
                </p>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-300">
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  className={`w-full ${
                    selectedPlan === plan.id
                      ? 'bg-gradient-to-l from-blue-600 to-purple-600'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  انتخاب پلن
                </Button>
              </div>
            ))}
          </div>

          <div className="glass-card rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">مراحل کار</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-blue-600/20 rounded-full flex items-center justify-center">
                  <span className="text-blue-400 font-bold">۱</span>
                </div>
                <h3 className="text-white font-bold mb-1">مشاوره</h3>
                <p className="text-gray-400 text-sm">بررسی نیازمندی‌ها</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-purple-600/20 rounded-full flex items-center justify-center">
                  <span className="text-purple-400 font-bold">۲</span>
                </div>
                <h3 className="text-white font-bold mb-1">طراحی</h3>
                <p className="text-gray-400 text-sm">طراحی UI/UX</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-pink-600/20 rounded-full flex items-center justify-center">
                  <span className="text-pink-400 font-bold">۳</span>
                </div>
                <h3 className="text-white font-bold mb-1">توسعه</h3>
                <p className="text-gray-400 text-sm">پیاده‌سازی و کدنویسی</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-600/20 rounded-full flex items-center justify-center">
                  <span className="text-green-400 font-bold">۴</span>
                </div>
                <h3 className="text-white font-bold mb-1">تحویل</h3>
                <p className="text-gray-400 text-sm">راه‌اندازی و آموزش</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}