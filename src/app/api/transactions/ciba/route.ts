import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { pollCIBAStatus } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { transactionId, action } = await req.json()

  const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } })
  if (!transaction) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'poll' && transaction.cibaRequestId) {
    const status = await pollCIBAStatus(transaction.cibaRequestId)

    if (status.status === 'approved') {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { cibaStatus: 'approved', status: 'approved', approvedBy: session.user.sub },
      })
    } else if (status.status === 'denied') {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { cibaStatus: 'denied', status: 'denied' },
      })
    }

    return NextResponse.json({ cibaStatus: status.status })
  }

  // Manual approve/deny from dashboard
  if (action === 'approve' || action === 'deny') {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        cibaStatus: action,
        status: action === 'approve' ? 'approved' : 'denied',
        approvedBy: action === 'approve' ? session.user.sub : null,
      },
    })

    await prisma.auditLog.create({
      data: {
        businessId: transaction.businessId,
        action: `ciba_${action}`,
        entity: 'Transaction',
        entityId: transactionId,
        description: `Owner manually ${action}d transaction via CIBA dashboard`,
        performedBy: session.user.sub,
      },
    })

    return NextResponse.json({ success: true, status: action === 'approve' ? 'approved' : 'denied' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
