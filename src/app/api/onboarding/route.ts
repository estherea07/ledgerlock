import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bizName, phone, dailyLimit } = await req.json()

  await prisma.business.upsert({
    where: { ownerId: session.user.sub },
    update: { name: bizName, ownerPhone: phone },
    create: { ownerId: session.user.sub, ownerEmail: session.user.email, name: bizName, ownerPhone: phone },
  })

  const business = await prisma.business.findUnique({ where: { ownerId: session.user.sub } })
  if (!business) return NextResponse.json({ error: 'Failed' }, { status: 500 })

  // Upsert spending limit policy
  const existing = await prisma.policy.findFirst({ where: { businessId: business.id, type: 'spending_limit' } })
  if (existing) {
    await prisma.policy.update({ where: { id: existing.id }, data: { value: JSON.stringify({ daily: dailyLimit, perTransaction: dailyLimit / 2 }) } })
  } else {
    await prisma.policy.create({
      data: { businessId: business.id, name: 'Daily Spending Limit', type: 'spending_limit', value: JSON.stringify({ daily: dailyLimit, perTransaction: dailyLimit / 2 }) },
    })
  }

  return NextResponse.json({ success: true })
}
