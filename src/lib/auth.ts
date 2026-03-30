import { getSession } from '@auth0/nextjs-auth0'
import { prisma } from './db'

export async function getBusinessFromSession() {
  const session = await getSession()
  if (!session?.user) return null

  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.sub },
    include: {
      staff: true,
      policies: { where: { isActive: true } },
      vaultTokens: { where: { isActive: true } },
    },
  })

  return business
}

export async function requireAuth() {
  const session = await getSession()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  return session.user
}

// Auth0 Token Vault - get management API token
export async function getAuth0ManagementToken(): Promise<string> {
  const response = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.AUTH0_MGMT_CLIENT_ID,
      client_secret: process.env.AUTH0_MGMT_CLIENT_SECRET,
      audience: process.env.AUTH0_AUDIENCE,
      grant_type: 'client_credentials',
    }),
  })

  const data = await response.json()
  return data.access_token
}

// Auth0 Token Vault - store a token reference
export async function storeTokenInVault(
  userId: string,
  provider: string,
  token: string,
  scopes: string[]
): Promise<string> {
  const mgmtToken = await getAuth0ManagementToken()

  // Store connection in Auth0 Token Vault
  const response = await fetch(
    `${process.env.AUTH0_TOKEN_VAULT_URL}/api/v2/users/${userId}/linked_accounts`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mgmtToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        link_with: token,
        provider,
        scopes,
      }),
    }
  )

  const data = await response.json()
  return data.identityId || `vault_${provider}_${Date.now()}`
}

// Auth0 CIBA - initiate backchannel authentication for step-up
export async function initiateCIBA(
  loginHint: string,
  bindingMessage: string,
  scope: string = 'openid'
): Promise<{ auth_req_id: string; expires_in: number }> {
  const response = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/bc-authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.AUTH0_CLIENT_ID!,
      client_secret: process.env.AUTH0_CLIENT_SECRET!,
      login_hint: JSON.stringify({ format: 'iss_sub', iss: process.env.AUTH0_ISSUER_BASE_URL!, sub: loginHint }),
      binding_message: bindingMessage,
      scope,
      request_expiry: '300',
    }),
  })

  return response.json()
}

// Poll CIBA status
export async function pollCIBAStatus(authReqId: string): Promise<{ status: string; access_token?: string }> {
  const response = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.AUTH0_CLIENT_ID!,
      client_secret: process.env.AUTH0_CLIENT_SECRET!,
      grant_type: 'urn:openid:params:grant-type:ciba',
      auth_req_id: authReqId,
    }),
  })

  const data = await response.json()
  if (data.error === 'authorization_pending') return { status: 'pending' }
  if (data.error === 'access_denied') return { status: 'denied' }
  if (data.access_token) return { status: 'approved', access_token: data.access_token }
  return { status: 'pending' }
}
