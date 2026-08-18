'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { motion } from 'framer-motion'

export default function TestimonialCarousel() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const testimonials = [
    {
      name: 'مهدی رضایی',
      role: 'صاحب فروشگاه آنلاین',
      content: 'ربات سفارشگیر تلگرام از روز اول زندگی فروش من را تغییر داد. دیگر هیچ سفارشی گم نمی‌شود!',
      avatar: 'https://picsum.photos/id/64/150/150',
    },
    {
      name: 'سارا احمدی',
      role: 'تاجر آنلاین',
      content: 'قیمت مناسب + پشتیبانی عالی + راه‌اندازی در ۴۸ ساعت. بهترین تصمیم زندگی من بود.',
      avatar: 'https://picsum.photos/id/91/150/150',
    },
    {
      name: 'حسن کریمی',
      role: 'تاجر لوازم یدکی',
      content: 'ربات سفارشگیر + CRM در یک جا. درآمدم ۳ برابر شد!',
      avatar: 'https://picsum.photos/id/201/150/150',
    },
  ]

  return (
    <div className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold">نظرات مشتریان ما</h2>
        <p className="text-muted-foreground mt-3">صدها کسب‌وکار با ما فروششان را ۵ برابر کرده‌اند</p>
      </div>

      <Carousel className="max-w-5xl mx-auto">
        <CarouselContent>
          {testimonials.map((testimonial, index) => (
            <CarouselItem key={index}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="bg-card border border-border">
                  <CardHeader>
                    <Avatar>
                      <AvatarImage src={testimonial.avatar} />
                      <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="mt-4">{testimonial.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg italic leading-relaxed">“{testimonial.content}”</p>
                  </CardContent>
                </Card>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  )
}