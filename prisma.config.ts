import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: 'file:./dev.db', // دقیقاً همون فایلی که قبلاً گفتی
  },
})