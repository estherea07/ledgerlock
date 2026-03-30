// src/lib/auth/auth0.ts
// Phase 1 — Auth0 + Token Vault configuration

import { initAuth0 } from '@auth0/nextjs-auth0'

export const auth0 = initAuth0({
  secret: process.env.AUTH0_SECRET!,
  baseURL: process.env.AUTH0_BASE_URL!,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL!,
  clientID: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  authorizationParams: {
    response_type: 'code',
    scope: 'openid profile email offline_access',
    audience: process.env.AUTH0_MANAGEMENT_AUDIENCE,
  },
  session: {
    absoluteDuration: 60 * 60 * 24 * 7, // 7 days
  },
})

// -----------------------------------------------
// Auth0 Management API — for Token Vault & CIBA
// -----------------------------------------------

let managementToken: string | null = null
let tokenExpiry = 0

export async function getManagementToken(): Promise<string> {
  if (managementToken && Date.now() < tokenExpiry) {
    return managementToken
  }

  const response = await fetch(
    `${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
        client_secret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
        audience: process.env.AUTH0_MANAGEMENT_AUDIENCE,
        grant_type: 'client_credentials',
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Auth0 Management token error: ${response.statusText}`)
  }

  const data = await response.json()
  managementToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return managementToken!
}

// -----------------------------------------------
// Token Vault — store and retrieve service tokens
// -----------------------------------------------

export async function storeTokenInVault(params: {
  auth0UserId: string
  connectionName: string // e.g. 'paystack', 'gtbank'
  accessToken: string
  refreshToken?: string
  expiresAt?: number
}) {
  const mgmtToken = await getManagementToken()
  const { auth0UserId, connectionName, accessToken, refreshToken, expiresAt } = params

  const response = await fetch(
    `${process.env.AUTH0_ISSUER_BASE_URL}/api/v2/users/${auth0UserId}/linked-accounts`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mgmtToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'oauth2',
        connection_id: connectionName,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresAt,
      }),
    }
  )

  return response.json()
}

export async function getTokenFromVault(params: {
  auth0UserId: string
  connectionName: string
}): Promise<{ access_token: string; expires_at: number } | null> {
  const mgmtToken = await getManagementToken()
  const { auth0UserId, connectionName } = params

  const response = await fetch(
    `${process.env.AUTH0_ISSUER_BASE_URL}/api/v2/users/${encodeURIComponent(auth0UserId)}/tokens/${connectionName}`,
    {
      headers: { Authorization: `Bearer ${mgmtToken}` },
    }
  )

  if (!response.ok) return null
  return response.json()
}

// -----------------------------------------------
// CIBA — Client-Initiated Backchannel Authentication
// Sends push notification to owner for step-up auth
// -----------------------------------------------

export async function initiateCIBA(params: {
  loginHint: string      // owner's email or phone
  bindingMessage: string // shown on owner's device
  scope?: string
}): Promise<{ auth_req_id: string; expires_in: number }> {
  const { loginHint, bindingMessage, scope = 'openid profile email' } = params

  const response = await fetch(
    `${process.env.AUTH0_ISSUER_BASE_URL}/bc-authorize`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.AUTH0_CIBA_CLIENT_ID!,
        client_secret: process.env.AUTH0_CIBA_CLIENT_SECRET!,
        login_hint: JSON.stringify({ format: 'iss_sub', iss: process.env.AUTH0_ISSUER_BASE_URL!, sub: loginHint }),
        binding_message: bindingMessage,
        scope,
        request_expiry: '120',
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`CIBA initiation failed: ${err}`)
  }

  return response.json()
}

export async function pollCIBA(authReqId: string): Promise<{
  status: 'pending' | 'approved' | 'denied'
  access_token?: string
}> {
  const response = await fetch(
    `${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.AUTH0_CIBA_CLIENT_ID!,
        client_secret: process.env.AUTH0_CIBA_CLIENT_SECRET!,
        grant_type: 'urn:openid:params:grant-type:ciba',
        auth_req_id: authReqId,
      }),
    }
  )

  if (response.status === 400) {
    const body = await response.json()
    if (body.error === 'authorization_pending') return { status: 'pending' }
    if (body.error === 'access_denied') return { status: 'denied' }
  }

  if (!response.ok) return { status: 'denied' }

  const data = await response.json()
  return { status: 'approved', access_token: data.access_token }
}
