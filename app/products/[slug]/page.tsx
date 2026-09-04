import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Shield,
  Clock,
  Zap,
} from 'lucide-react'
import { BuyButton } from '@/components/buy-button'

// ============================================================
// Page Props
// ============================================================

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

// ============================================================
// Features Parser
// ============================================================

function parseFeatures(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(
      (item): item is string => typeof item === 'string'
    )
  } catch {
    return []
  }
}

// ============================================================
// Dynamic SEO Metadata
// ============================================================

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params

  const product = await prisma.product.findUnique({
    where: { slug },
  })

  if (!product) {
    return {
      title: 'محصول یافت نشد',
      description: 'محصول مورد نظر یافت نشد.',
    }
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const productUrl = `${siteUrl}/products/${product.slug}`

  return {
    title: product.title,
    description: product.shortDesc,

    alternates: {
      canonical: productUrl,
    },

    openGraph: {
      title: product.title,
      description: product.shortDesc,
      url: productUrl,
      type: 'website',
      locale: 'fa_IR',
      images: product.imageUrl
        ? [
            {
              url: product.imageUrl,
              alt: product.title,
            },
          ]
        : [],
    },

    twitter: {
      card: product.imageUrl
        ? 'summary_large_image'
        : 'summary',
      title: product.title,
      description: product.shortDesc,
      images: product.imageUrl
        ? [product.imageUrl]
        : [],
    },
  }
}

// ============================================================
// Product Page
// ============================================================

export default async function ProductPage({
  params,
}: PageProps) {
  const { slug } = await params

  // اگر slug وجود نداشت
  if (!slug) {
    notFound()
  }

  // دریافت محصول از دیتابیس
  const product = await prisma.product.findUnique({
    where: { slug },
  })

  // اگر محصول وجود نداشت
  if (!product) {
    notFound()
  }

  // تبدیل features از JSON string به string[]
  const features = parseFeatures(product.features)

  // ============================================================
  // Pricing Plans
  // ============================================================

  const plans = [
    {
      name: 'پایه',
      price: product.priceBase,
      features,
      popular: false,
    },
    {
      name: 'حرفه‌ای',
      price: product.pricePro,
      features,
      popular: true,
    },
    {
      name: 'سازمانی',
      price: product.priceOrg,
      features,
      popular: false,
    },
  ]

  // ============================================================
  // Price Formatter
  // ============================================================

  const formatPrice = (price: number) => {
    return `${price.toLocaleString('fa-IR')} تومان`
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-5xl mx-auto">

        {/* ======================================================
            دکمه بازگشت
        ====================================================== */}

        <Link
          href="/products"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowRight className="ml-2 h-4 w-4" />
          بازگشت به محصولات
        </Link>

        {/* ======================================================
            هدر محصول
        ====================================================== */}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold">
              {product.title}
            </h1>

            <p className="text-muted-foreground mt-2 text-lg">
              {product.shortDesc}
            </p>
          </div>

          <Badge
            variant={
              product.status === 'active'
                ? 'default'
                : 'secondary'
            }
            className="text-lg px-4 py-2"
          >
            {product.status === 'active'
              ? 'فعال'
              : 'به زودی'}
          </Badge>
        </div>

        {/* ======================================================
            تصویر محصول
        ====================================================== */}

        {product.imageUrl && (
          <div className="mb-8 rounded-2xl overflow-hidden">
            <Image
              src={product.imageUrl}
              alt={product.title}
              width={1200}
              height={600}
              className="w-full h-64 md:h-96 object-cover"
            />
          </div>
        )}

        {/* ======================================================
            توضیحات محصول
        ====================================================== */}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              توضیحات محصول
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-lg leading-relaxed">
              {product.description}
            </p>
          </CardContent>
        </Card>

        {/* ======================================================
            امکانات
        ====================================================== */}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              امکانات
            </CardTitle>
          </CardHeader>

          <CardContent>
            {features.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />

                    <span>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                امکاناتی برای این محصول ثبت نشده است.
              </p>
            )}
          </CardContent>
        </Card>

        {/* ======================================================
            پلن‌های قیمت
        ====================================================== */}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">
              انتخاب پلن قیمت
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="پایه">

              {/* تب‌ها */}

              <TabsList className="grid w-full grid-cols-3">
                {plans.map((plan) => (
                  <TabsTrigger
                    key={plan.name}
                    value={plan.name}
                    className="relative"
                  >
                    {plan.name}

                    {plan.popular && (
                      <Badge className="absolute -top-3 right-1/2 translate-x-1/2 text-xs">
                        محبوب
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* محتوای تب‌ها */}

              {plans.map((plan) => (
                <TabsContent
                  key={plan.name}
                  value={plan.name}
                >
                  <div className="text-center py-8">

                    <p className="text-5xl font-bold mb-2">
                      {formatPrice(plan.price)}
                    </p>

                    <p className="text-muted-foreground mb-6">
                      یک‌بار مصرف، مادام‌العمر
                    </p>

                    {plan.features.length > 0 && (
                      <ul className="space-y-4 mb-8 max-w-md mx-auto">
                        {plan.features.map(
                          (feature, index) => (
                            <li
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />

                              <span>
                                {feature}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    )}

                    {product.status === 'active' ? (
                      <BuyButton
                        productId={product.id}
                        planName={plan.name}
                        amount={plan.price}
                        className="w-full md:w-auto px-12"
                      />
                    ) : (
                      <Button
                        size="lg"
                        disabled
                        className="w-full md:w-auto px-12"
                      >
                        به زودی
                      </Button>
                    )}

                  </div>
                </TabsContent>
              ))}

            </Tabs>
          </CardContent>
        </Card>

        {/* ======================================================
            دکمه‌های اقدام
        ====================================================== */}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">

          {product.demoUrl ? (
            <Button
              size="lg"
              asChild
            >
              <Link
                href={product.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                دمو رایگان
              </Link>
            </Button>
          ) : (
            <Button
              size="lg"
              disabled
            >
              دمو در دسترس نیست
            </Button>
          )}

          <Button
            size="lg"
            variant="outline"
            asChild
          >
            <Link href="/contact">
              تماس با پشتیبانی
            </Link>
          </Button>

        </div>

        {/* ======================================================
            ویژگی‌های بیشتر
        ====================================================== */}

        <section className="mt-20">

          <h2 className="text-3xl font-bold text-center mb-12">
            چرا ربات سفارشگیر؟
          </h2>

          <div className="grid md:grid-cols-4 gap-6">

            {/* سرعت بالا */}

            <Card>
              <CardHeader>
                <Zap className="h-12 w-12 text-primary mb-4" />

                <CardTitle>
                  سرعت بالا
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-muted-foreground">
                  ثبت سفارش در کمتر از ۲ ثانیه
                </p>
              </CardContent>
            </Card>

            {/* امنیت کامل */}

            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />

                <CardTitle>
                  امنیت کامل
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-muted-foreground">
                  رمزنگاری اطلاعات و تراکنش‌ها
                </p>
              </CardContent>
            </Card>

            {/* پشتیبانی */}

            <Card>
              <CardHeader>
                <Clock className="h-12 w-12 text-primary mb-4" />

                <CardTitle>
                  پشتیبانی ۲۴/۷
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-muted-foreground">
                  پشتیبانی شبانه‌روزی از شما
                </p>
              </CardContent>
            </Card>

            {/* به‌روزرسانی */}

            <Card>
              <CardHeader>
                <Sparkles className="h-12 w-12 text-primary mb-4" />

                <CardTitle>
                  به‌روزرسانی مداوم
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-muted-foreground">
                  به‌روزرسانی رایگان مادام‌العمر
                </p>
              </CardContent>
            </Card>

          </div>
        </section>

      </div>
    </div>
  )
}