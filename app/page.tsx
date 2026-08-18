'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Users, ShoppingCart, Award, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import TestimonialCarousel from '@/components/testimonial-carousel'

export default function Home() {
  const stats = [
    { number: '۴۲', label: 'سفارشات روزانه', icon: Zap },
    { number: '۹۸٪', label: 'رضایت مشتری', icon: Award },
    { number: '۱۵۰+', label: 'مشتری راضی', icon: Users },
    { number: '۹۹٪', label: 'زمان راه‌اندازی', icon: CheckCircle2 },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="pt-20 pb-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-6xl font-bold leading-tight mb-6"
          >
            مدیریت خودکار سفارشات<br />با <span className="text-blue-600">ربات سفارشگیر تلگرام</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            ثبت سفارش خودکار • مدیریت محصولات • گزارش فروش • پرداخت • پیام به مشتری
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <Link href="/products/rabot-sarkhor-gir">
                شروع خرید <ArrowRight className="mr-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              دمو رایگان
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-muted/50">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <stat.icon className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-5xl font-bold">{stat.number}</h3>
              <p className="text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Products Preview */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">محصولات ما</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <img src="/images/robot-telegram.jpg" alt="ربات" className="w-full h-48 object-cover rounded-t-xl" />
                <CardTitle className="mt-4">ربات سفارشگیر تلگرام</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">ثبت سفارش خودکار از همه کانال‌ها</p>
                <Button asChild className="w-full">
                  <Link href="/products/rabot-sarkhor-gir">جزئیات + خرید</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialCarousel />

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold mb-6">آماده شروع فروش خودکار هستید؟</h2>
          <Button size="lg" asChild className="text-xl px-10 py-7">
            <Link href="/products/rabot-sarkhor-gir">
              خرید ربات سفارشگیر تلگرام
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}