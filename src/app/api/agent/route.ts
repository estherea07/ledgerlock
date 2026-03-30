import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { prisma } from '@/lib/db'
import { runElfAnalysis } from '@/lib/agent/elf'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const business = await prisma.business.findUnique({ where: { ownerId: session.user.sub } })
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    const body = await req.json()
    const { amount, vendor, description, type, staffId } = body
    const transaction = await prisma.transaction.create({
      data: { businessId: business.id, staffId: staffId || null, amount: parseFloat(amount), vendor: vendor || null, description, type, status: 'pending', riskReasons: '[]' },
    })
    const elfResult = await runElfAnalysis({ transactionId: transaction.id, businessId: business.id, staffId: staffId || null, amount: parseFloat(amount), vendor: vendor || null, description, type })
    return NextResponse.json({ transactionId: transaction.id, elfDecision: elfResult.decision, riskScore: elfResult.riskScore, cibaRequired: elfResult.cibaRequired })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}