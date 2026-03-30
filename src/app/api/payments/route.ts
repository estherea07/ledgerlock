// src/app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth/auth0'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth0.getSession(req as any, {} as any)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const business = await db.business.findUnique({
      where: { ownerAuth0Id: session.user.sub },
    })
    if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')

    const transactions = await db.transaction.findMany({
      where: {
        businessId: business.id,
        ...(status ? { status } : {}),
      },
      include: { staff: true, paymentLink: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ transactions })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
