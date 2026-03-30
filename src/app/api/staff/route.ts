import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const business = await prisma.business.findUnique({ where: { ownerId: session.user.sub } })
  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const staff = await prisma.staffMember.findMany({
    where: { businessId: business.id },
    include: {
      _count: { select: { transactions: true, paymentLinks: true } },
    },
    orderBy: { riskScore: 'desc' },
  })

  return NextResponse.json({ staff })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const business = await prisma.business.findUnique({ where: { ownerId: session.user.sub } })
  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { name, email, role } = await req.json()

  const staff = await prisma.staffMember.create({
    data: { businessId: business.id, name, email, role },
  })

  return NextResponse.json({ staff })
}
