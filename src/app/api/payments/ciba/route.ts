import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { prisma } from '@/lib/db'
import { pollCIBAStatus } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const transactionId = searchParams.get('transactionId')
  if (!transactionId) return NextResponse.json({ error: 'transactionId required' }, { status: 400 })
  const tx = await prisma.transaction.findUnique({ where: { id: transactionId } })
  if (!tx?.cibaRequestId) return NextResponse.json({ status: 'no_ciba' })
  const cibaResult = await pollCIBAStatus(tx.cibaRequestId)
  if (cibaResult.status === 'approved') {
    await prisma.transaction.update({ where: { id: transactionId }, data: { status: 'approved', cibaStatus: 'approved' } })
  } else if (cibaResult.status === 'denied') {
    await prisma.transaction.update({ where: { id: transactionId }, data: { status: 'denied', cibaStatus: 'denied' } })
  }
  return NextResponse.json({ status: cibaResult.status })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { transactionId, action } = await req.json()
  if (!transactionId || !['approve', 'deny'].includes(action)) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.sub } })
  const tx = await prisma.transaction.findFirst({ where: { id: transactionId, businessId: business?.id } })
  if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const newStatus = action === 'approve' ? 'approved' : 'denied'
  await prisma.transaction.update({ where: { id: transactionId }, data: { status: newStatus, cibaStatus: action === 'approve' ? 'approved' : 'denied' } })
  await prisma.auditLog.create({ data: { businessId: business!.id, action: `ciba_${action}`, entity: 'Transaction', entityId: transactionId, description: `Owner ${action}d transaction`, performedBy: session.user.sub } })
  return NextResponse.json({ success: true, status: newStatus })
}