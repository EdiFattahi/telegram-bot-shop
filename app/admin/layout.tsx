import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import AdminSidebar from '@/components/admin-sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // بررسی احراز هویت
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    redirect('/login')
  }

  const user = await verifyToken(token)

  if (!user || user.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* سایدبار */}
        <AdminSidebar />
        
        {/* محتوای اصلی */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}