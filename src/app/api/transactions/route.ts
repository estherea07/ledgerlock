import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { prisma } from '@/lib/db'
import { runElfAnalysis } from '@/lib/agent/elf'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const business = await prisma.business.findUnique({ where: { ownerId: session.user.sub } })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

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
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const business = await prisma.business.findUnique({ where: { ownerId: session.user.sub } })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const body = await req.json()
  const { amount, vendor, description, type, staffId } = body

  if (!amount || !description || !type) {
    return NextResponse.json({ error: 'amount, description and type are required' }, { status: 400 })
  }

  // Create pending transaction first so UI gets a response fast
  const transaction = await prisma.transaction.create({
    data: {
      businessId: business.id,
      staffId: staffId || null,
      amount: parseFloat(amount),
      vendor: vendor || null,
      description,
      type,
      status: 'pending',
      riskReasons: '[]',
    },
  })

  // Run Elf analysis with a 25s timeout so it never hangs forever
  let elfResult = { decision: 'pending', riskScore: 0, riskReasons: [], cibaRequired: false, cibaRequestId: null }

  try {
    const analysisPromise = runElfAnalysis({
      transactionId: transaction.id,
      businessId: business.id,
      staffId: staffId || null,
      amount: parseFloat(amount),
      vendor: vendor || null,
      description,
      type,
    })

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Elf analysis timeout')), 25000)
    )

    elfResult = await Promise.race([analysisPromise, timeoutPromise]) as typeof elfResult
  } catch (err: any) {
    console.error('Elf analysis error:', err.message)
    // Fall back to rule-based decision if AI times out
    const riskScore = parseFloat(amount) > 50000 ? 40 : 5
    const decision = riskScore >= 35 ? 'flagged' : 'approved'
    elfResult = {
      decision,
      riskScore,
      riskReasons: riskScore >= 35 ? ['Amount exceeds safe threshold — flagged for review'] : [],
      cibaRequired: riskScore >= 35,
      cibaRequestId: null,
    }
    // Update transaction with fallback decision
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: decision,
        riskLevel: riskScore >= 35 ? 'high' : 'low',
        riskReasons: JSON.stringify(elfResult.riskReasons),
        cibaRequired: elfResult.cibaRequired,
      },
    })
  }

  return NextResponse.json({
    transaction: { ...transaction, status: elfResult.decision },
    elfDecision: elfResult.decision,
    riskScore: elfResult.riskScore,
    riskReasons: elfResult.riskReasons,
    cibaRequired: elfResult.cibaRequired,
    message: `Elf decision: ${elfResult.decision?.toUpperCase()}`,
  })
}
