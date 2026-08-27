import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { status } = await req.json()

    const validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'refunded']
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'وضعیت نامعتبر' },
        { status: 400 }
      )
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی سفارش' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 401 }
      )
    }

    const { id } = await params
    
    await prisma.order.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { error: 'خطا در حذف سفارش' },
      { status: 500 }
    )
  }
}