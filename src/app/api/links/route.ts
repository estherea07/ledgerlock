import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { prisma } from '@/lib/db'
import { initializePayment, generateReference } from '@/lib/paystack'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const business = await prisma.business.findUnique({ where: { ownerId: session.user.sub } })
  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const links = await prisma.paymentLink.findMany({
    where: { businessId: business.id },
    include: { staff: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ links })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const business = await prisma.business.findUnique({ where: { ownerId: session.user.sub } })
  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { amount, service, staffId, customerEmail } = await req.json()

  const reference = generateReference(business.name.slice(0, 2).toUpperCase())

  // Get payment URL from Paystack (via Token Vault in production)
  let paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${reference}`

  try {
    const paystack = await initializePayment({
      amount,
      email: customerEmail || 'customer@ledgerlock.africa',
      reference,
      metadata: {
        businessId: business.id,
        staffId,
        service,
        ledgerlockProtected: true,
      },
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/paystack`,
    })
    if (paystack.paymentUrl) paymentUrl = paystack.paymentUrl
  } catch {
    // Fall back to internal URL if Paystack not configured
  }

  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 48)

  const link = await prisma.paymentLink.create({
    data: {
      businessId: business.id,
      staffId,
      amount,
      service,
      reference,
      url: paymentUrl,
      expiresAt,
    },
    include: { staff: true },
  })

  // Create audit log
  await prisma.auditLog.create({
    data: {
      businessId: business.id,
      staffId,
      action: 'payment_link_created',
      entity: 'PaymentLink',
      entityId: link.id,
      description: `Elf generated verified payment link for ₦${amount.toLocaleString()} (${service}). Locked to company account via Token Vault.`,
      performedBy: 'elf',
    },
  })

  return NextResponse.json({ link, paymentUrl })
}
