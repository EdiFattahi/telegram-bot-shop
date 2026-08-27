'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react'
import Particles from '@/components/particles'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // اینجا می‌تونید اتصال به API یا ایمیل اضافه کنید
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
      
      setTimeout(() => setSuccess(false), 3000)
    }, 1000)
  }

  const contactInfo = [
    { icon: Mail, label: 'ایمیل', value: 'info@example.com' },
    { icon: Phone, label: 'تلفن', value: '۰۹۱۲-۳۴۵-۶۷۸۹' },
    { icon: MapPin, label: 'آدرس', value: 'تهران، ایران' },
    { icon: MessageCircle, label: 'تلگرام', value: '@your_telegram' },
  ]

  return (
    <div className="relative min-h-screen">
      <Particles />
      
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">تماس با ما</span>
            </h1>
            <p className="text-gray-400 text-lg">
              سوالی دارید؟ خوشحال می‌شویم کمک کنیم
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* اطلاعات تماس */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contactInfo.map((info, index) => (
                  <div key={index} className="glass-card rounded-2xl p-6 card-hover">
                    <info.icon className="w-8 h-8 text-blue-400 mb-3" />
                    <h3 className="text-sm text-gray-400 mb-1">{info.label}</h3>
                    <p className="text-white font-medium">{info.value}</p>
                  </div>
                ))}
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">ساعات کاری</h3>
                <div className="space-y-2 text-gray-400">
                  <p>شنبه تا چهارشنبه: ۹ صبح تا ۶ عصر</p>
                  <p>پنجشنبه: ۹ صبح تا ۲ بعدازظهر</p>
                  <p>جمعه: تعطیل</p>
                </div>
              </div>
            </div>

            {/* فرم تماس */}
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-white">ارسال پیام</CardTitle>
              </CardHeader>
              <CardContent>
                {success ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Send className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">پیام ارسال شد!</h3>
                    <p className="text-gray-400">به زودی با شما تماس می‌گیریم</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">نام و نام خانوادگی *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                        placeholder="نام شما"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">ایمیل *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                        placeholder="example@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-white">موضوع *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                        placeholder="موضوع پیام"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-white">پیام *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                        placeholder="پیام خود را بنویسید..."
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-l from-blue-600 to-purple-600 hover:scale-105 transition-transform"
                      disabled={loading}
                    >
                      {loading ? 'در حال ارسال...' : 'ارسال پیام'}
                      <Send className="mr-2 h-4 w-4" />
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}