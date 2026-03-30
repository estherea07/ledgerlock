// src/app/api/payments/ciba/route.ts
// Poll CIBA status or manually approve/deny

import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth/auth0'
import { db } from '@/lib/db'
import { pollCIBA } from '@/lib/auth/auth0'
import { createAuditLog } from '@/lib/agent/audit'

// GET: poll CIBA status for a transaction
export async function GET(req: NextRequest) {
  const session = await auth0.getSession(req as any, {} as any)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const transactionId = searchParams.get('transactionId')

  if (!transactionId) return NextResponse.json({ error: 'transactionId required' }, { status: 400 })

  const tx = await db.transaction.findUnique({ where: { id: transactionId } })
  if (!tx?.cibaRequestId) return NextResponse.json({ status: 'no_ciba' })

  const cibaResult = await pollCIBA(tx.cibaRequestId)

  if (cibaResult.status === 'approved') {
    await db.transaction.update({
      where: { id: transactionId },
      data: { status: 'approved' },
    })
    await createAuditLog({
      businessId: tx.businessId,
      actor: 'owner',
      action: 'ciba_approved',
      details: { transactionId },
    })
  } else if (cibaResult.status === 'denied') {
    await db.transaction.update({
      where: { id: transactionId },
      data: { status: 'denied' },
    })
    await createAuditLog({
      businessId: tx.businessId,
      actor: 'owner',
      action: 'ciba_denied',
      details: { transactionId },
    })
  }

  return NextResponse.json({ status: cibaResult.status })
}

// POST: owner manually approves or denies (dashboard fallback)
export async function POST(req: NextRequest) {
  const session = await auth0.getSession(req as any, {} as any)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { transactionId, action } = await req.json()
  if (!transactionId || !['approve', 'deny'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const business = await db.business.findUnique({
    where: { ownerAuth0Id: session.user.sub },
  })

  const tx = await db.transaction.findFirst({
    where: { id: transactionId, businessId: business?.id },
  })

  if (!tx) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })

  const newStatus = action === 'approve' ? 'approved' : 'denied'

  await db.transaction.update({
    where: { id: transactionId },
    data: { status: newStatus },
  })

  // Resolve related alert
  await db.alert.updateMany({
    where: {
      businessId: business!.id,
      metadata: { contains: transactionId },
      status: 'open',
    },
    data: { status: 'resolved' },
  })

  await createAuditLog({
    businessId: business!.id,
    actor: `owner:${session.user.sub}`,
    action: `manual_${action}`,
    details: { transactionId },
  })

  return NextResponse.json({ success: true, status: newStatus })
}
