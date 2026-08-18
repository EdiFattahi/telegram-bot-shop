import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-bold">ربات سفارشگیر</h3>
            <p className="text-sm text-muted-foreground">
              راهکار هوشمند مدیریت سفارشات در تلگرام
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">محصولات</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-primary">همه محصولات</Link></li>
              <li><Link href="/custom-site" className="hover:text-primary">ربات اختصاصی</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">صفحات</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary">درباره ما</Link></li>
              <li><Link href="/blog" className="hover:text-primary">وبلاگ</Link></li>
              <li><Link href="/contact" className="hover:text-primary">تماس با ما</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">ارتباط با ما</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>ایمیل: info@example.com</li>
              <li>تلگرام: @YourBot</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} ربات سفارشگیر. تمام حقوق محفوظ است.
        </div>
      </div>
    </footer>
  );
}