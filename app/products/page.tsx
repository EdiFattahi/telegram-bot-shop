import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'محصولات | فروشگاه محصولات دیجیتال',
  description: 'ربات تلگرام، اتوماسیون اداری، مشاوره AI و طراحی سایت',
}

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: {
      status: { in: ['active', 'coming-soon'] }
    },
    orderBy: { createdAt: 'desc' }
  })

  const formatPrice = (price: number) => {
    if (price === 0) return 'رایگان'
    return price.toLocaleString('fa-IR') + ' تومان'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-l from-primary to-blue-600 bg-clip-text text-transparent">
            همه محصولات
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            محصولات دیجیتال با کیفیت برای رشد کسب‌وکار شما
          </p>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => {
              const features = JSON.parse(product.features as string)
              const isComingSoon = product.status === 'coming-soon'
              
              return (
                <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="relative">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.title}
                        width={800}
                        height={400}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center">
                        <Sparkles className="w-16 h-16 text-primary/40" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      {isComingSoon ? (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          به زودی
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">
                          فعال
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-2">{product.title}</h2>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {product.shortDesc}
                    </p>

                    {/* Features Preview */}
                    <div className="space-y-2 mb-4">
                      {features.slice(0, 3).map((feature: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-sm text-muted-foreground">شروع قیمت از</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatPrice(product.priceBase)}
                        </p>
                      </div>
                    </div>

                    {/* CTA */}
                    <Button 
                      asChild 
                      className="w-full"
                      variant={isComingSoon ? 'outline' : 'default'}
                      disabled={isComingSoon}
                    >
                      <Link href={`/products/${product.slug}`}>
                        {isComingSoon ? 'به زودی' : 'مشاهده و خرید'}
                        <ArrowLeft className="mr-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-2xl text-muted-foreground">محصولی یافت نشد</p>
            <p className="mt-2">لطفاً بعداً مراجعه کنید</p>
          </div>
        )}
      </div>
    </div>
  )
}