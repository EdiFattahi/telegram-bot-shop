/**
 * تبدیل مبلغ از تومان به ریال
 *
 * تمام قیمت‌های داخلی سیستم در Database بر اساس تومان هستند.
 * زرین‌پال مبلغ را بر اساس ریال دریافت می‌کند.
 */
export function tomanToRial(amountToman: number): number {
  if (!Number.isInteger(amountToman) || amountToman <= 0) {
    throw new Error('Invalid payment amount')
  }

  const amountRial = amountToman * 10

  if (!Number.isSafeInteger(amountRial)) {
    throw new Error('Payment amount exceeds safe integer range')
  }

  return amountRial
}