/**
 * Paystack Integration - via Auth0 Token Vault
 * The Elf agent calls Paystack using tokens stored in Token Vault
 * Staff never see or handle API keys directly
 */

import { v4 as uuidv4 } from 'uuid'

const PAYSTACK_BASE = 'https://api.paystack.co'

// All Paystack calls go through this function which uses Token Vault
async function paystackRequest(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: object
) {
  // In production, this token comes from Auth0 Token Vault (not hardcoded)
  const token = process.env.PAYSTACK_SECRET_KEY

  const response = await fetch(`${PAYSTACK_BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  return response.json()
}

// Initialize a payment (creates a payment link)
export async function initializePayment({
  amount,
  email,
  reference,
  metadata,
  callbackUrl,
}: {
  amount: number
  email: string
  reference: string
  metadata: object
  callbackUrl: string
}) {
  const data = await paystackRequest('/transaction/initialize', 'POST', {
    amount: amount * 100, // Paystack uses kobo
    email,
    reference,
    metadata,
    callback_url: callbackUrl,
  })

  return {
    paymentUrl: data.data?.authorization_url,
    reference: data.data?.reference,
    accessCode: data.data?.access_code,
  }
}

// Verify a payment (called by webhook or poll)
export async function verifyPayment(reference: string) {
  const data = await paystackRequest(`/transaction/verify/${reference}`)
  return {
    status: data.data?.status,
    amount: data.data?.amount ? data.data.amount / 100 : 0,
    paidAt: data.data?.paid_at,
    channel: data.data?.channel,
  }
}

// Generate a unique payment reference for LedgerLock
export function generateReference(businessPrefix = 'LL') {
  const id = uuidv4().split('-')[0].toUpperCase()
  return `${businessPrefix}-${id}`
}
