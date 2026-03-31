import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function generatePaymentLink({
  businessId,
  staffId,
  amount,
  service,
  currency = 'NGN',
}: {
  businessId: string
  staffId: string
  amount: number
  service: string
  currency?: string
}) {
  const reference = `LL-${uuidv4().split('-')[0].toUpperCase()}`
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${reference}`

  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 48)

  const link = await prisma.paymentLink.create({
    data: {
      businessId,
      staffId,
      amount,
      service,
      currency,
      reference,
      url,
      expiresAt,
    },
  })

  await prisma.auditLog.create({
    data: {
      businessId,
      staffId,
      action: 'payment_link_created',
      entity: 'PaymentLink',
      entityId: link.id,
      description: `Elf generated verified payment link for ₦${amount.toLocaleString()} (${service}). Locked to company account via Token Vault.`,
      performedBy: 'elf',
    },
  })

  return link
}

export async function reconcilePaymentLink(linkId: string) {
  const link = await prisma.paymentLink.findUnique({
    where: { id: linkId },
    include: { business: true },
  })

  if (!link) return null

  const isExpired = new Date(link.expiresAt) < new Date()

  if (isExpired && !link.depositFound) {
    await prisma.paymentLink.update({
      where: { id: linkId },
      data: { status: 'flagged' },
    })

    await prisma.auditLog.create({
      data: {
        businessId: link.businessId,
        staffId: link.staffId,
        action: 'payment_link_flagged',
        entity: 'PaymentLink',
        entityId: link.id,
        description: `Payment link expired with no deposit found. Ref: ${link.reference}`,
        performedBy: 'elf',
      },
    })
  }

  return link
}