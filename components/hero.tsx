import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-20 md:py-32">
      <div className="container mx-auto px-4 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-2 backdrop-blur-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">ربات سفارشگیر هوشمند</span>
        </div>
        
        <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight md:text-6xl lg:text-7xl">
          مدیریت خودکار سفارشات با
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {" "}ربات تلگرام
          </span>
        </h1>
        
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          ثبت سفارش، مدیریت محصولات، گزارش فروش و پرداخت خودکار همه در یک ربات تلگرام حرفه‌ای
        </p>
        
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="gap-2">
            <Link href="/products">
              مشاهده محصولات
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/custom-site">سفارش ربات اختصاصی</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}