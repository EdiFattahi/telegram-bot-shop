'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface BuyButtonProps {
  productId: string
  planName: string
  amount: number
  className?: string
}

export function BuyButton({ productId, planName, amount, className }: BuyButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleBuy = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/payment/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId, 
          plan: planName,
          amount 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'خطا در ایجاد پرداخت')
      }

      if (data.success && data.paymentUrl) {
        // پرداخت واقعی
        window.location.href = data.paymentUrl
      } else if (data.success && data.testMode) {
        // حالت تست
        alert(`سفارش تستی ثبت شد.\nشماره سفارش: ${data.orderId.slice(0, 8)}`)
        router.push(`/payment/success?orderId=${data.orderId}`)
      }
    } catch (error: any) {
      alert(error.message || 'خطا در ایجاد پرداخت')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="lg"
      onClick={handleBuy}
      disabled={loading}
      className={className}
    >
      {loading ? 'در حال پردازش...' : `خرید پلن ${planName}`}
    </Button>
  )
}