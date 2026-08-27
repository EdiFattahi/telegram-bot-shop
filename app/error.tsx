'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
        <h2 className="text-3xl font-bold text-white mb-4">خطایی رخ داد</h2>
        <p className="text-gray-400 mb-8">
          متاسفانه مشکلی پیش آمده است. لطفاً دوباره تلاش کنید
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-gradient-to-l from-blue-600 to-purple-600 text-white rounded-xl hover:scale-105 transition-transform"
        >
          تلاش مجدد
        </button>
      </div>
    </div>
  )
}