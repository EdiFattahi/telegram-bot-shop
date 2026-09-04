'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Star } from 'lucide-react'

interface Testimonial {
  id: string
  name: string
  role: string
  content: string
  avatar?: string | null
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[]
}

export default function TestimonialCarousel({
  testimonials,
}: TestimonialCarouselProps) {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
          نظرات مشتریان
        </h2>

        <p className="text-center text-gray-600 mb-12">
          مشتریان ما چه می‌گویند؟
        </p>

        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {testimonials.map((testimonial) => (
              <CarouselItem
                key={testimonial.id}
                className="md:basis-1/2 lg:basis-1/3"
              >
                <div className="card-elegant p-6 h-full">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>

                  <p className="text-gray-700 leading-relaxed mb-6 text-sm">
                    &quot;{testimonial.content}&quot;
                  </p>

                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={testimonial.avatar || ''} />
                      <AvatarFallback className="bg-teal-700 text-white">
                        {testimonial.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <h3 className="font-bold text-gray-900">
                        {testimonial.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious className="bg-white border-gray-200 text-gray-700" />
          <CarouselNext className="bg-white border-gray-200 text-gray-700" />
        </Carousel>
      </div>
    </section>
  )
}
