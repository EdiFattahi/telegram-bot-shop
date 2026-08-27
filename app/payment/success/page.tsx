'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, ArrowLeft } from 'lucide-react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="card-elegant p-8 max-w-md w-full text-center">
        <CheckCircle2 className="w-20 h-20 mx-auto mb-6 text-green-500" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          پرداخت موفق بود!
        </h1>
        <p className="text-gray-600 mb-6">
          سفارش شما با موفقیت ثبت شد
        </p>
        {orderId && (
          <p className="text-sm text-gray-500 mb-6">
            شماره سفارش: {orderId.slice(0, 8)}
          </p>
        )}
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-teal-700 hover:text-teal-800"
        >
          <ArrowLeft className="w-4 h-4" />
          بازگشت به محصولات
        </Link>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}