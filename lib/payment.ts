import ZarinpalCheckout from 'zarinpal-checkout'

const zarinpal = ZarinpalCheckout.create(
  process.env.ZARINPAL_MERCHANT_ID!,
  false // sandbox mode
)

export async function createPayment(amount: number, orderId: string) {
  const response = await zarinpal.PaymentRequest({
    Amount: amount,
    CallbackURL: `${process.env.NEXTAUTH_URL}/api/payment/callback`,
    Description: `پرداخت سفارش ${orderId}`,
  })
  
  if (response.status === 100) {
    return response.url
  }
  
  throw new Error('Payment request failed')
}