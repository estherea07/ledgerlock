import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const business = await prisma.business.findUnique({ where: { ownerId: session.user.sub } })
    if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const transactions = await prisma.transaction.findMany({
      where: { businessId: business.id, ...(status ? { status } : {}) },
      include: { staff: true, paymentLink: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return NextResponse.json({ transactions })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}