// src/lib/agent/audit.ts
import { db } from '@/lib/db'

export async function createAuditLog(params: {
  businessId: string
  actor: string
  action: string
  details: Record<string, unknown>
  auth0LogId?: string
}) {
  return db.auditLog.create({
    data: {
      businessId: params.businessId,
      actor: params.actor,
      action: params.action,
      details: JSON.stringify(params.details),
      auth0LogId: params.auth0LogId,
    },
  })
}
