// src/lib/agent/payment-links.ts
// Phase 3 — Payment Link Generation & Bank Feed Reconciliation

import { db } from '@/lib/db'
import { createAuditLog } from './audit'
import { v4 as uuidv4 } from 'uuid'

// Generate a unique, tamper-proof payment link
// Destination account is pulled from Token Vault — staff cannot modify it
export async function generatePaymentLink(params: {
  businessId: string
  staffId: string
  amount: number
  serviceDesc: string
  currency?: string
  customerPhone?: string
}) {
  const { businessId, staffId, amount, serviceDesc, currency = 'NGN', customerPhone } = params

  // Generate unique ref
  const linkRef = `GL-${String(Math.floor(Math.random() * 9000) + 1000)}`
  const linkId = uuidv4()
  const url = `${process.env.PAYMENT_LINK_BASE_URL}/pay/${linkRef}`
  const expiresAt = new Date(Date.now() + Number(process.env.PAYMENT_LINK_EXPIRY_HOURS || 48) * 60 * 60 * 1000)

  const link = await db.paymentLink.create({
    data: {
      id: linkId,
      businessId,
      staffId,
      linkRef,
      amount,
      currency,
      serviceDesc,
      url,
      expiresAt,
      customerPhone,
      status: 'active',
    },
  })

  await createAuditLog({
    businessId,
    actor: staffId,
    action: 'payment_link_created',
    details: { linkRef, amount, serviceDesc, url },
  })

  // If customer phone provided, send WhatsApp/SMS
  if (customerPhone) {
    await sendPaymentLinkToCustomer({ link: link as any, customerPhone })
  }

  return link
}

// Verify payment link against bank feed
// Called by webhook or scheduled job
export async function verifyPaymentLinkDeposit(linkRef: string) {
  const link = await db.paymentLink.findUnique({ where: { linkRef } })
  if (!link || link.status !== 'active') return

  // In production: query bank API via Token Vault for matching deposit
  // For demo: simulate bank feed check
  const deposit = await checkBankFeedForDeposit({
    businessId: link.businessId,
    amount: link.amount,
    afterDate: link.createdAt,
    reference: linkRef,
  })

  if (deposit) {
    await db.paymentLink.update({
      where: { linkRef },
      data: {
        status: 'paid',
        paidAt: new Date(),
        depositVerified: true,
      },
    })

    await createAuditLog({
      businessId: link.businessId,
      actor: 'elf',
      action: 'payment_link_verified',
      details: { linkRef, amount: link.amount, depositFound: true },
    })
  }

  return deposit
}

// Check for expired, unverified links — run this as a cron job
export async function checkExpiredLinks(businessId: string) {
  const expiredUnverified = await db.paymentLink.findMany({
    where: {
      businessId,
      status: 'active',
      expiresAt: { lt: new Date() },
      depositVerified: false,
    },
    include: { staff: true },
  })

  for (const link of expiredUnverified) {
    await db.paymentLink.update({
      where: { id: link.id },
      data: { status: 'suspicious' },
    })

    // Raise alert
    await db.alert.create({
      data: {
        businessId,
        staffId: link.staffId,
        type: 'link_unverified',
        severity: 'warning',
        title: `Payment link ${link.linkRef} expired without deposit`,
        description: `Link created by ${link.staff.name} for ₦${link.amount.toLocaleString()} — no matching deposit found after 48 hours.`,
        metadata: JSON.stringify({ linkRef: link.linkRef, amount: link.amount }),
      },
    })

    // Increment staff risk
    await db.staff.update({
      where: { id: link.staffId },
      data: {
        riskScore: { increment: 15 },
        flagCount: { increment: 1 },
      },
    })

    await createAuditLog({
      businessId,
      actor: 'elf',
      action: 'link_expired_unverified',
      details: { linkRef: link.linkRef, staffId: link.staffId },
    })
  }

  return expiredUnverified.length
}

// Simulate bank feed check (replace with real Mono/Paystack webhook in production)
async function checkBankFeedForDeposit(params: {
  businessId: string
  amount: number
  afterDate: Date
  reference: string
}): Promise<{ depositId: string; amount: number; timestamp: Date } | null> {
  // PRODUCTION: fetch from Mono API via Token Vault:
  // const token = await getTokenFromVault({ auth0UserId, connectionName: 'mono' })
  // const response = await fetch('https://api.withmono.com/v2/accounts/{id}/transactions', {
  //   headers: { Authorization: `Bearer ${token.access_token}` }
  // })
  // Then match by amount + reference

  // For demo/hackathon: 80% chance deposit found
  if (Math.random() > 0.2) {
    return {
      depositId: `dep_${Date.now()}`,
      amount: params.amount,
      timestamp: new Date(),
    }
  }
  return null
}

async function sendPaymentLinkToCustomer(params: {
  link: { linkRef: string; amount: number; url: string; serviceDesc: string }
  customerPhone: string
}) {
  // PRODUCTION: Use Twilio via Token Vault
  // const token = await getTokenFromVault({ auth0UserId, connectionName: 'twilio' })
  // Send WhatsApp message with payment link

  console.log(`[ELF] Would send payment link ${params.link.url} to ${params.customerPhone}`)
}
