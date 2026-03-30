import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { prisma } from '@/lib/db'
import { getAuth0ManagementToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const business = await prisma.business.findUnique({ where: { ownerId: session.user.sub } })
  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const tokens = await prisma.vaultToken.findMany({
    where: { businessId: business.id },
  })

  return NextResponse.json({ tokens })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const business = await prisma.business.findUnique({ where: { ownerId: session.user.sub } })
  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { provider, displayName, scopes, token } = await req.json()

  // In production: store actual token in Auth0 Token Vault via Management API
  // Here we store only the reference (never the raw token in our DB)
  const tokenRef = `vault_${provider}_${session.user.sub}_${Date.now()}`

  const vaultToken = await prisma.vaultToken.create({
    data: {
      businessId: business.id,
      provider,
      displayName,
      scopes: JSON.stringify(scopes),
      tokenRef,
    },
  })

  await prisma.auditLog.create({
    data: {
      businessId: business.id,
      action: 'vault_token_added',
      entity: 'VaultToken',
      entityId: vaultToken.id,
      description: `${displayName} connected to Token Vault with scopes: ${scopes.join(', ')}`,
      performedBy: session.user.sub,
    },
  })

  return NextResponse.json({ vaultToken })
}
