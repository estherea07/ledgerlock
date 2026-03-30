// src/app/api/agent/route.ts
// Run Elf agent on a new transaction request

import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth/auth0'
import { db } from '@/lib/db'
import { runElf } from '@/lib/agent/elf'
import { z } from 'zod'

const schema = z.object({
  type: z.enum(['incoming', 'outgoing']),
  amount: z.number().positive(),
  currency: z.string().default('NGN'),
  description: z.string().min(1),
  vendorName: z.string().optional(),
  destinationAccount: z.string().optional(),
  paymentLinkId: z.string().optional(),
  staffId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth0.getSession(req as any, {} as any)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const business = await db.business.findUnique({
      where: { ownerAuth0Id: session.user.sub },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const body = schema.parse(await req.json())

    // Create the transaction record first
    const transaction = await db.transaction.create({
      data: {
        businessId: business.id,
        staffId: body.staffId,
        paymentLinkId: body.paymentLinkId,
        type: body.type,
        amount: body.amount,
        currency: body.currency,
        description: body.description,
        vendorName: body.vendorName,
        destinationAccount: body.destinationAccount,
        status: 'pending',
        riskLevel: 'low',
      },
    })

    // Run Elf
    const elfResult = await runElf({
      transactionId: transaction.id,
      businessId: business.id,
      staffId: body.staffId,
      type: body.type,
      amount: body.amount,
      currency: body.currency,
      description: body.description,
      vendorName: body.vendorName,
      destinationAccount: body.destinationAccount,
      paymentLinkId: body.paymentLinkId,
    })

    // Return Elf's decision
    return NextResponse.json({
      transactionId: transaction.id,
      decision: elfResult.decision,
      riskLevel: elfResult.riskLevel,
      elfReasoning: elfResult.elfReasoning,
      cibaRequestId: elfResult.cibaRequestId,
      flags: [...(elfResult.policyViolations || []), ...(elfResult.anomalyFlags || [])],
    })
  } catch (err) {
    console.error('[ELF AGENT ERROR]', err)
    return NextResponse.json(
      { error: 'Agent processing failed', details: String(err) },
      { status: 500 }
    )
  }
}
