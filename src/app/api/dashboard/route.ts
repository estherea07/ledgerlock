import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const business = await prisma.business.findUnique({ where: { ownerId: session.user.sub } })
  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [transactions, links, staff, auditLogs] = await Promise.all([
    prisma.transaction.findMany({
      where: { businessId: business.id },
      include: { staff: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.paymentLink.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.staffMember.findMany({
      where: { businessId: business.id },
      orderBy: { riskScore: 'desc' },
      take: 5,
    }),
    prisma.auditLog.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  const revenueProtected = transactions
    .filter(t => t.status === 'approved' && t.type === 'incoming')
    .reduce((sum, t) => sum + t.amount, 0)

  const threatsBlocked = transactions.filter(t => t.status === 'blocked').length
  const pendingCIBA = transactions.filter(t => t.cibaRequired && t.cibaStatus === 'pending')
  const staffAtRisk = staff.filter(s => s.riskScore >= 60).length

  return NextResponse.json({
    business,
    metrics: { revenueProtected, threatsBlocked, linksIssued: links.length, staffAtRisk },
    recentTransactions: transactions,
    pendingCIBA,
    staffOverview: staff,
    recentAuditLogs: auditLogs,
  })
}
