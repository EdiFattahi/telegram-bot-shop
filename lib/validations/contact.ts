import { z } from 'zod'

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'نام باید حداقل ۲ کاراکتر باشد.')
    .max(100, 'نام نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد.'),

  email: z
    .string()
    .trim()
    .email('ایمیل واردشده معتبر نیست.')
    .max(254, 'ایمیل نمی‌تواند بیشتر از ۲۵۴ کاراکتر باشد.'),

  subject: z
    .string()
    .trim()
    .min(3, 'موضوع باید حداقل ۳ کاراکتر باشد.')
    .max(200, 'موضوع نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد.'),

  message: z
    .string()
    .trim()
    .min(10, 'پیام باید حداقل ۱۰ کاراکتر باشد.')
    .max(5000, 'پیام نمی‌تواند بیشتر از ۵۰۰۰ کاراکتر باشد.'),
})

export type ContactInput = z.infer<typeof contactSchema>