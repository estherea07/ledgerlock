import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPayment } from '@/lib/paystack'
import { sendPaymentConfirmation } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (body.event === 'charge.success') {
    const reference = body.data.reference
    const metadata = body.data.metadata

    const verified = await verifyPayment(reference)

    if (verified.status === 'success') {
      const link = await prisma.paymentLink.findUnique({ where: { reference } })

      if (link) {
        await prisma.paymentLink.update({
          where: { reference },
          data: { status: 'paid', paidAt: new Date(), depositFound: true },
        })

        await prisma.transaction.create({
          data: {
            businessId: link.businessId,
            staffId: link.staffId,
            paymentLinkId: link.id,
            type: 'incoming',
            amount: link.amount,
            description: `Payment via Link: ${link.service}`,
            status: 'approved',
            riskLevel: 'low',
          },
        })

        await prisma.auditLog.create({
          data: {
            businessId: link.businessId,
            action: 'payment_received',
            entity: 'PaymentLink',
            entityId: link.id,
            description: `\u20A6${link.amount.toLocaleString()} received and verified for ${link.service}`,
            performedBy: 'elf',
          },
        })

        const customerPhone = body.data.customer?.phone
        if (customerPhone && metadata?.businessId) {
          const business = await prisma.business.findUnique({ where: { id: metadata.businessId } })
          if (business) {
            await sendPaymentConfirmation({
              customerPhone,
              amount: link.amount,
              businessName: business.name,
              reference,
            })
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}
