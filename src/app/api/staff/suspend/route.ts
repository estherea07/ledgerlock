import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { staffId } = await req.json()

  const staff = await prisma.staffMember.update({
    where: { id: staffId },
    data: { isActive: false },
  })

  await prisma.auditLog.create({
    data: {
      businessId: staff.businessId,
      staffId,
      action: 'staff_suspended',
      entity: 'StaffMember',
      entityId: staffId,
      description: `${staff.name} suspended by owner after fraud risk threshold exceeded`,
      performedBy: session.user.sub,
    },
  })

  return NextResponse.json({ success: true })
}
