import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Sparkles, Shield, Clock, Zap } from 'lucide-react'

// این صفحه در سرور اجرا می‌شود (برای SEO بهتر)
interface PageProps {
  params: {
    slug: string
  }
}

export default async function ProductPage({ params }: PageProps) {
  // ====================== رفع مشکل undefined ======================
  const { slug } = await params
  
  // اگر slug وجود نداشت، خطای 404 بده
  if (!slug) {
    notFound()
  }

  // دریافت محصول از دیتابیس
  const product = await prisma.product.findUnique({
    where: { slug },
  })

  // اگر محصول وجود نداشت، خطای 404 نمایش بده
  if (!product) notFound()

  const plans = [
    {
      name: 'پایه',
      price: product.priceBase,
      features: product.features as string[],
      popular: false,
    },
    {
      name: 'حرفه‌ای',
      price: product.pricePro,
      features: product.features as string[],
      popular: true,
    },
    {
      name: 'سازمانی',
      price: product.priceOrg,
      features: product.features as string[],
      popular: false,
    },
  ]

  const formatPrice = (price: number) => {
    return price.toLocaleString('fa-IR') + ' تومان'
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* دکمه بازگشت */}
        <Link href="/products" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
          <ArrowRight className="ml-2 h-4 w-4" />
          بازگشت به محصولات
        </Link>

        {/* هدر محصول */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold">{product.title}</h1>
            <p className="text-muted-foreground mt-2 text-lg">{product.shortDesc}</p>
          </div>
          <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className="text-lg px-4 py-2">
            {product.status === 'active' ? 'فعال' : 'به زودی'}
          </Badge>
        </div>

        {/* توضیحات */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>توضیحات محصول</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed">{product.description}</p>
          </CardContent>
        </Card>

        {/* امکانات */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>امکانات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(product.features as string[]).map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* پلن‌های قیمت */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">انتخاب پلن قیمت</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="پایه">
              <TabsList className="grid w-full grid-cols-3">
                {plans.map((plan, index) => (
                  <TabsTrigger key={index} value={plan.name} className="relative">
                    {plan.name}
                    {plan.popular && (
                      <Badge className="absolute -top-3 right-1/2 translate-x-1/2 text-xs">
                        محبوب
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {plans.map((plan, index) => (
                <TabsContent key={index} value={plan.name}>
                  <div className="text-center py-8">
                    <p className="text-5xl font-bold mb-2">{formatPrice(plan.price)}</p>
                    <p className="text-muted-foreground mb-6">یک‌بار مصرف، مادام‌العمر</p>
                    <ul className="space-y-4 mb-8 max-w-md mx-auto">
                      {(plan.features as string[]).map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button size="lg" className="w-full md:w-auto px-12">
                      خرید — شروع پرداخت
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* دکمه‌های اقدام */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href={product.demoUrl || '#'}>
              دمو رایگان
            </Link>
          </Button>
          <Button size="lg" variant="outline">
            تماس با پشتیبانی
          </Button>
        </div>

        {/* ویژگی‌های بیشتر */}
        <section className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">چرا ربات سفارشگیر؟</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Zap className="h-12 w-12 text-primary mb-4" />
                <CardTitle>سرعت بالا</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">ثبت سفارش در کمتر از ۲ ثانیه</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle>امنیت کامل</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">رمزنگاری اطلاعات و تراکنش‌ها</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Clock className="h-12 w-12 text-primary mb-4" />
                <CardTitle>پشتیبانی ۲۴/۷</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">پشتیبانی شبانه‌روزی از شما</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Sparkles className="h-12 w-12 text-primary mb-4" />
                <CardTitle>به‌روزرسانی مداوم</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">به‌روزرسانی رایگان مادام‌العمر</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}