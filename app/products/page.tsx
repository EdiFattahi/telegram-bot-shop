'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { motion } from 'framer-motion'

const products = [
  { id: 1, slug: 'rabot-sarkhor-gir', title: 'ربات سفارشگیر تلگرام', price: 2000000, shortDesc: 'ثبت سفارش خودکار', image: '/images/robot-telegram.jpg', status: 'active' },
  { id: 2, slug: 'automate-adaf', title: 'اتوماسیون اداری', price: 0, shortDesc: 'به زودی', image: '/images/automation-admin.jpg', status: 'coming-soon' },
]

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const filtered = products.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) &&
    (category === 'all' || p.status === category)
  )

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">همه محصولات</h1>

        {/* فیلتر */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <Input placeholder="جستجو در محصولات..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md" />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="دسته‌بندی" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه</SelectItem>
              <SelectItem value="active">فعال</SelectItem>
              <SelectItem value="coming-soon">به زودی</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {filtered.map((product, i) => (
            <motion.div key={product.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardHeader>
                  <img src={product.image} alt={product.title} className="w-full h-48 object-cover rounded-t-xl" />
                  <CardTitle className="mt-4">{product.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{product.shortDesc}</p>
                  <Badge>{product.status}</Badge>
                  <Button asChild className="w-full mt-6">
                    <Link href={`/products/${product.slug}`}>جزئیات + خرید</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}